"""Pydantic models for User data."""

from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime


class UserBase(BaseModel):
    """Core user fields."""
    uid: str
    email: str
    username: Optional[str] = None
    display_name: Optional[str] = Field(None, alias="displayName")
    photo_url: Optional[str] = Field(None, alias="photoURL")

    model_config = {"populate_by_name": True}


class UserResponse(BaseModel):
    """User profile API response."""
    uid: str
    email: str
    username: Optional[str] = None
    display_name: Optional[str] = Field(None, alias="displayName")
    photo_url: Optional[str] = Field(None, alias="photoURL")
    created_at: Optional[datetime] = Field(None, alias="createdAt")

    model_config = {"populate_by_name": True}


class UserWithToken(BaseModel):
    """Auth response with user + token."""
    user: UserResponse
    token: str


class RegisterRequest(BaseModel):
    """Email/password registration."""
    email: str
    password: str


class LoginRequest(BaseModel):
    """Email/password login."""
    email: str
    password: str


class GoogleAuthRequest(BaseModel):
    """Google sign-in with ID token."""
    id_token: str = Field(..., alias="idToken")

    model_config = {"populate_by_name": True}


class UsernameCheckResponse(BaseModel):
    """Username availability check."""
    available: bool


class UpdateUsernameRequest(BaseModel):
    """Update username request."""
    username: str
    display_name: str = Field(..., alias="displayName")

    model_config = {"populate_by_name": True}
