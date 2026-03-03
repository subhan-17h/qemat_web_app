from __future__ import annotations

"""Authentication API router.

Endpoints:
  POST /api/auth/register       — Create account with email/password
  POST /api/auth/login          — Sign in with email/password
  POST /api/auth/google         — Sign in with Google ID token
  POST /api/auth/verify-token   — Verify Firebase ID token (recommended flow)
  POST /api/auth/logout         — Sign out (client-side)
  GET  /api/auth/me             — Get current user profile
  GET  /api/auth/username/check — Check username availability
  PUT  /api/auth/username       — Update username
"""

from fastapi import APIRouter, Depends, HTTPException, Query

from app.dependencies import get_current_user
from app.models.user import (
    RegisterRequest,
    LoginRequest,
    GoogleAuthRequest,
    UserResponse,
    UserWithToken,
    UsernameCheckResponse,
    UpdateUsernameRequest,
)
from app.services import auth_service

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=UserWithToken)
async def register(request: RegisterRequest):
    """Create a new account with email and password.
    
    Creates both Firebase Auth user and Firestore user document.
    """
    try:
        result = await auth_service.create_user_with_email(request.email, request.password)
        return result
    except Exception as e:
        error_msg = str(e)
        if "EMAIL_EXISTS" in error_msg or "already exists" in error_msg.lower():
            raise HTTPException(status_code=409, detail="An account already exists with this email")
        if "WEAK_PASSWORD" in error_msg or "weak" in error_msg.lower():
            raise HTTPException(status_code=400, detail="The password provided is too weak")
        if "INVALID_EMAIL" in error_msg:
            raise HTTPException(status_code=400, detail="Invalid email address")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login", response_model=UserWithToken)
async def login(request: LoginRequest):
    """Sign in with email and password.
    
    Returns a verified Firebase ID token and user profile.
    """
    try:
        result = await auth_service.sign_in_with_email(request.email, request.password)
        return result
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/google", response_model=UserWithToken)
async def google_auth(request: GoogleAuthRequest):
    """Sign in with Google. Verifies the Google ID token via Firebase.
    
    The frontend gets the Google ID token via Firebase Auth's signInWithPopup(),
    then sends it here for server-side verification and user creation.
    """
    try:
        decoded = await auth_service.verify_firebase_token(request.id_token)
        user = await auth_service.get_or_create_user(
            uid=decoded["uid"],
            email=decoded.get("email", ""),
            display_name=decoded.get("name"),
            photo_url=decoded.get("picture"),
        )
        return UserWithToken(user=user, token=request.id_token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid Google token: {str(e)}")


@router.post("/verify-token")
async def verify_token(claims: dict = Depends(get_current_user)):
    """Verify a Firebase ID token and return the user profile.
    
    This is the RECOMMENDED auth flow:
    1. Frontend signs in with Firebase Auth SDK
    2. Frontend gets ID token
    3. Frontend sends token in Authorization header
    4. Backend verifies and returns user profile
    """
    user = await auth_service.get_or_create_user(
        uid=claims["uid"],
        email=claims.get("email", ""),
        display_name=claims.get("name"),
        photo_url=claims.get("picture"),
    )
    return {"user": user}


@router.post("/logout")
async def logout(claims: dict = Depends(get_current_user)):
    """Sign out.
    
    Revokes refresh tokens server-side.
    """
    await auth_service.logout_user(claims["uid"])
    return {"success": True}


@router.get("/me", response_model=UserResponse)
async def get_me(claims: dict = Depends(get_current_user)):
    """Get the current user's profile."""
    user = await auth_service.get_user_profile(claims["uid"])
    if not user:
        raise HTTPException(status_code=404, detail="User profile not found")
    return user


@router.get("/username/check", response_model=UsernameCheckResponse)
async def check_username(username: str = Query(..., min_length=3, max_length=30)):
    """Check if a username is available."""
    available = await auth_service.is_username_available(username)
    return UsernameCheckResponse(available=available)


@router.put("/username")
async def update_username(
    request: UpdateUsernameRequest,
    claims: dict = Depends(get_current_user),
):
    """Update the current user's username and display name."""
    try:
        await auth_service.update_username(claims["uid"], request.username, request.display_name)
        return {"success": True}
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
