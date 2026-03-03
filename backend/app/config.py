from __future__ import annotations

from typing import Optional
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from .env file."""

    # Firebase
    firebase_project_id: str = "qemat-a2a2c"
    firebase_service_account_path: str = "./service-account.json"
    firebase_storage_bucket: str = "qemat-a2a2c.firebasestorage.app"
    firebase_web_api_key: Optional[str] = None

    # Cloud Function URLs (existing)
    product_metadata_url: str = "https://asia-south1-qemat-a2a2c.cloudfunctions.net/getProductMetadata"
    pharma_metadata_url: str = "https://asia-south1-qemat-a2a2c.cloudfunctions.net/getPharmaceuticalsMetadata"

    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    cors_origins: str = "http://localhost:3000,https://qemat.com"

    # Database
    database_url: Optional[str] = None

    # Caching (seconds)
    bundle_cache_ttl: int = 3600  # 1 hour
    trending_cache_ttl: int = 86400  # 24 hours

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
