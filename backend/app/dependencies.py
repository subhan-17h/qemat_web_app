from __future__ import annotations

"""Auth dependency — extracts and verifies Firebase ID token from request headers."""

from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.services import auth_service
from app.config import get_settings

# Bearer token scheme for Swagger UI
_bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer_scheme),
) -> dict:
    """Verify the Firebase ID token from Authorization header.
    
    Returns decoded token claims (uid, email, etc).
    Raises 401 if token is missing or invalid.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        decoded = await auth_service.verify_firebase_token(credentials.credentials)
        return decoded
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer_scheme),
) -> Optional[dict]:
    """Optionally verify the Firebase ID token.
    
    Returns decoded claims if token present and valid, None otherwise.
    Used for endpoints that support both authenticated and guest users.
    """
    if credentials is None:
        return None

    try:
        decoded = await auth_service.verify_firebase_token(credentials.credentials)
        return decoded
    except Exception:
        return None


async def get_qr_analytics_admin(user: dict = Depends(get_current_user)) -> dict:
    """Allow QR analytics access only to explicitly configured Firebase users."""
    email = str(user.get("email", "")).strip().lower()
    allowed_emails = get_settings().qr_analytics_admin_emails_list
    if not email or email not in allowed_emails:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to view QR analytics",
        )
    return user
