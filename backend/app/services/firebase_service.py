from __future__ import annotations

"""Firebase Admin SDK initialization and Firestore/Storage client access."""

import os
from typing import Optional
import firebase_admin
from firebase_admin import credentials, firestore, auth, storage
from google.cloud.firestore_v1.client import Client as FirestoreClient

from app.config import get_settings

_firebase_app: Optional[firebase_admin.App] = None


def init_firebase() -> firebase_admin.App:
    """Initialize Firebase Admin SDK. Safe to call multiple times."""
    global _firebase_app
    if _firebase_app is not None:
        return _firebase_app

    settings = get_settings()
    service_account_path = settings.firebase_service_account_path

    if os.path.exists(service_account_path):
        cred = credentials.Certificate(service_account_path)
        _firebase_app = firebase_admin.initialize_app(cred, {
            "storageBucket": settings.firebase_storage_bucket,
        })
    else:
        # Fall back to Application Default Credentials (e.g. on Cloud Run)
        _firebase_app = firebase_admin.initialize_app(options={
            "storageBucket": settings.firebase_storage_bucket,
        })

    return _firebase_app


def get_firestore_client() -> FirestoreClient:
    """Get the Firestore client. Initializes Firebase if needed."""
    init_firebase()
    return firestore.client()


def get_auth():
    """Get Firebase Auth module. Initializes Firebase if needed."""
    init_firebase()
    return auth


def get_storage_bucket():
    """Get Firebase Storage bucket. Initializes Firebase if needed."""
    init_firebase()
    return storage.bucket()
