from __future__ import annotations

import asyncpg
from typing import Optional

from app.config import get_settings

_pool: Optional[asyncpg.Pool] = None


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is not None:
        return _pool

    settings = get_settings()
    if not settings.database_url:
        raise RuntimeError("DATABASE_URL is not configured")

    _pool = await asyncpg.create_pool(dsn=settings.database_url, min_size=1, max_size=10)
    return _pool


async def close_pool() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None


async def init_db() -> None:
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS bundle_versions (
                type TEXT PRIMARY KEY,
                version TEXT NOT NULL,
                file_url TEXT NOT NULL,
                last_updated_at TIMESTAMPTZ,
                product_count INTEGER DEFAULT 0
            );
            """
        )

        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS products (
                id TEXT PRIMARY KEY,
                product_id TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                price DOUBLE PRECISION NOT NULL DEFAULT 0,
                store_id TEXT NOT NULL,
                category TEXT NOT NULL DEFAULT '',
                category_variations TEXT[] DEFAULT '{}',
                image_url TEXT NOT NULL DEFAULT '',
                original_url TEXT NOT NULL DEFAULT '',
                is_verified BOOLEAN NOT NULL DEFAULT FALSE,
                matched_product_ids TEXT[] DEFAULT '{}',
                matched_products_count INTEGER NOT NULL DEFAULT 0,
                is_pharma BOOLEAN NOT NULL DEFAULT FALSE,
                created_at TIMESTAMPTZ,
                last_updated TIMESTAMPTZ
            );
            """
        )

        await conn.execute("CREATE INDEX IF NOT EXISTS idx_products_is_pharma_store ON products (is_pharma, store_id);")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_products_is_pharma_category ON products (is_pharma, category);")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_products_is_pharma_name ON products (is_pharma, name);")
