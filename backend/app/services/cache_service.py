from __future__ import annotations

"""In-memory TTL cache for bundle data, trending products, and metadata."""

import time
from typing import Any, Optional


class CacheEntry:
    """A single cache entry with TTL."""
    def __init__(self, value: Any, ttl: int):
        self.value = value
        self.expires_at = time.time() + ttl

    @property
    def is_expired(self) -> bool:
        return time.time() >= self.expires_at


class CacheService:
    """Simple in-memory cache with TTL support."""

    def __init__(self):
        self._store: dict[str, CacheEntry] = {}

    def get(self, key: str) -> Optional[Any]:
        entry = self._store.get(key)
        if entry is None:
            return None
        if entry.is_expired:
            del self._store[key]
            return None
        return entry.value

    def set(self, key: str, value: Any, ttl: int = 3600) -> None:
        self._store[key] = CacheEntry(value, ttl)

    def delete(self, key: str) -> None:
        self._store.pop(key, None)

    def clear(self) -> None:
        self._store.clear()

    def has(self, key: str) -> bool:
        return self.get(key) is not None


# Singleton cache instance
cache = CacheService()
