from __future__ import annotations

"""Authentication service — Firebase Auth token verification and user management.

Mirrors the logic from Flutter's auth_service.dart.
"""

from datetime import datetime, timezone
from typing import Optional

import httpx
from firebase_admin import firestore as firebase_firestore

from app.config import get_settings
from app.services.firebase_service import get_firestore_client, get_auth
from app.models.user import UserResponse


async def verify_firebase_token(id_token: str) -> dict:
    """Verify a Firebase ID token and return decoded claims.
    
    This is the core auth mechanism — the React frontend uses Firebase Auth
    client SDK, then sends the ID token to our backend for verification.
    """
    auth = get_auth()
    decoded = auth.verify_id_token(id_token)
    return decoded


async def get_or_create_user(
    uid: str,
    email: str,
    display_name: Optional[str] = None,
    photo_url: Optional[str] = None,
) -> UserResponse:
    """Get user from Firestore or create if doesn't exist.
    
    Mirrors Flutter's user document creation in signUpWithEmailAndPassword()
    and signInWithGoogle().
    """
    db = get_firestore_client()
    user_ref = db.collection("users").document(uid)
    user_doc = user_ref.get()

    if user_doc.exists:
        data = user_doc.to_dict()
        # Update last sign-in time
        user_ref.update({
            "lastSignInTime": firebase_firestore.SERVER_TIMESTAMP,
        })
        return UserResponse(
            uid=uid,
            email=data.get("email", email),
            username=data.get("username"),
            display_name=data.get("displayName"),
            photo_url=data.get("photoURL"),
            created_at=_parse_firestore_timestamp(data.get("createdAt")),
        )
    else:
        # Create new user document (mirrors Flutter's signUp flow)
        user_data = {
            "email": email,
            "createdAt": firebase_firestore.SERVER_TIMESTAMP,
            "lastSignInTime": firebase_firestore.SERVER_TIMESTAMP,
        }
        if display_name:
            user_data["displayName"] = display_name
        if photo_url:
            user_data["photoURL"] = photo_url

        user_ref.set(user_data, merge=True)

        return UserResponse(
            uid=uid,
            email=email,
            username=None,
            display_name=display_name,
            photo_url=photo_url,
            created_at=datetime.now(timezone.utc),
        )


async def get_user_profile(uid: str) -> Optional[UserResponse]:
    """Get user profile from Firestore.
    
    Mirrors Flutter's getUserDisplayName() and getCurrentUser().
    """
    db = get_firestore_client()
    user_doc = db.collection("users").document(uid).get()

    if not user_doc.exists:
        return None

    data = user_doc.to_dict()
    return UserResponse(
        uid=uid,
        email=data.get("email", ""),
        username=data.get("username"),
        display_name=data.get("displayName"),
        photo_url=data.get("photoURL"),
        created_at=_parse_firestore_timestamp(data.get("createdAt")),
    )


async def is_username_available(username: str) -> bool:
    """Check if a username is available.
    
    Mirrors Flutter's isUsernameAvailable().
    """
    db = get_firestore_client()
    results = (
        db.collection("users")
        .where("username", "==", username)
        .limit(1)
        .get()
    )
    return len(results) == 0


async def update_username(uid: str, username: str, display_name: str) -> None:
    """Update user's username and display name.
    
    Mirrors Flutter's updateUsername().
    """
    db = get_firestore_client()
    user_ref = db.collection("users").document(uid)
    user_doc = user_ref.get()
    current_username = (user_doc.to_dict() or {}).get("username") if user_doc.exists else None

    # If username is unchanged for the same user, allow update.
    if username != current_username and not await is_username_available(username):
        raise ValueError("Username is already taken")

    user_ref.set({
        "username": username,
        "displayName": display_name,
        "updatedAt": firebase_firestore.SERVER_TIMESTAMP,
    }, merge=True)

    # Update Firebase Auth display name
    auth = get_auth()
    auth.update_user(uid, display_name=display_name)


async def create_user_with_email(email: str, password: str) -> dict:
    """Create a new Firebase Auth user with email/password.
    
    Mirrors Flutter's signUpWithEmailAndPassword().
    Returns the Firebase Auth user record as a dict.
    """
    auth = get_auth()
    user_record = auth.create_user(
        email=email,
        password=password,
    )

    # Create/get Firestore profile
    user = await get_or_create_user(user_record.uid, email)

    # Prefer ID token by signing in through Identity Toolkit if configured.
    id_token = await _sign_in_with_identity_toolkit(email=email, password=password)
    if not id_token:
        custom_token = auth.create_custom_token(user_record.uid)
        id_token = custom_token.decode("utf-8") if isinstance(custom_token, bytes) else custom_token

    return {"user": user, "token": id_token}


async def sign_in_with_email(email: str, password: str) -> dict:
    """Sign in with email/password.
    
    Uses Firebase Identity Toolkit REST API to validate email/password and
    return a Firebase ID token.
    """
    id_token = await _sign_in_with_identity_toolkit(email=email, password=password)
    if not id_token:
        raise ValueError("Email/password login requires FIREBASE_WEB_API_KEY")

    decoded = await verify_firebase_token(id_token)
    uid = decoded.get("uid")
    if not uid:
        raise ValueError("Failed to verify sign-in token")

    user = await get_or_create_user(
        uid=uid,
        email=decoded.get("email", email),
        display_name=decoded.get("name"),
        photo_url=decoded.get("picture"),
    )
    return {"user": user, "token": id_token}


async def logout_user(uid: str) -> None:
    """Revoke refresh tokens for the given user."""
    auth = get_auth()
    auth.revoke_refresh_tokens(uid)


async def _sign_in_with_identity_toolkit(email: str, password: str) -> Optional[str]:
    """Return Firebase ID token for email/password login when API key is configured."""
    settings = get_settings()
    if not settings.firebase_web_api_key:
        return None

    url = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword"
    payload = {
        "email": email,
        "password": password,
        "returnSecureToken": True,
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(url, params={"key": settings.firebase_web_api_key}, json=payload)

    if response.status_code >= 400:
        try:
            message = response.json().get("error", {}).get("message", "")
        except Exception:
            message = ""

        if message in {"INVALID_LOGIN_CREDENTIALS", "EMAIL_NOT_FOUND", "INVALID_PASSWORD"}:
            raise ValueError("Invalid email or password")
        raise ValueError(message or "Email/password sign-in failed")

    try:
        return response.json().get("idToken")
    except Exception as exc:
        raise ValueError("Invalid sign-in response from Firebase") from exc


def _parse_firestore_timestamp(value) -> Optional[datetime]:
    """Convert Firestore timestamp to Python datetime."""
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    if hasattr(value, "datetime"):
        return value.datetime()
    return None
