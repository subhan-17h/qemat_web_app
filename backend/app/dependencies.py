from __future__ import annotations

"""Auth dependency — extracts and verifies Firebase ID token from request headers."""

from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.services import auth_service

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
