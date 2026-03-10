from __future__ import annotations

from typing import Optional, Sequence
from datetime import datetime

from app.db import get_pool
from app.models.product import Product


def _row_to_product(row) -> Product:
    return Product(
        id=row["id"],
        product_id=row["product_id"],
        name=row["name"],
        price=row["price"],
        store_id=row["store_id"],
        category=row["category"],
        category_name_variations=row["category_variations"] or [],
        image_url=row["image_url"],
        original_url=row["original_url"],
        is_verified=row["is_verified"],
        matched_product_ids=row["matched_product_ids"] or [],
        matched_products_count=row["matched_products_count"],
        created_at=row["created_at"],
        last_updated=row["last_updated"],
        is_pharma=row["is_pharma"],
    )


async def get_bundle_version(product_type: str) -> Optional[dict]:
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT type, version, file_url, last_updated_at, product_count FROM bundle_versions WHERE type=$1",
            product_type,
        )
        if not row:
            return None
        return dict(row)


async def set_bundle_version(
    product_type: str,
    version: str,
    file_url: str,
    last_updated_at: Optional[str],
    product_count: int,
) -> None:
    parsed_last_updated = None
    if last_updated_at:
        try:
            parsed_last_updated = datetime.fromisoformat(str(last_updated_at).replace("Z", "+00:00"))
        except (ValueError, TypeError):
            parsed_last_updated = None

    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO bundle_versions (type, version, file_url, last_updated_at, product_count)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (type) DO UPDATE SET
                version = EXCLUDED.version,
                file_url = EXCLUDED.file_url,
                last_updated_at = EXCLUDED.last_updated_at,
                product_count = EXCLUDED.product_count;
            """,
            product_type,
            version,
            file_url,
            parsed_last_updated,
            product_count,
        )


async def upsert_products(products: Sequence[Product]) -> None:
    if not products:
        return
    pool = await get_pool()
    sql = """
        INSERT INTO products (
            id, product_id, name, price, store_id, category,
            category_variations, image_url, original_url, is_verified,
            matched_product_ids, matched_products_count, is_pharma,
            created_at, last_updated
        ) VALUES (
            $1, $2, $3, $4, $5, $6,
            $7, $8, $9, $10,
            $11, $12, $13,
            $14, $15
        )
        ON CONFLICT (product_id) DO UPDATE SET
            name = EXCLUDED.name,
            price = EXCLUDED.price,
            store_id = EXCLUDED.store_id,
            category = EXCLUDED.category,
            category_variations = EXCLUDED.category_variations,
            image_url = EXCLUDED.image_url,
            original_url = EXCLUDED.original_url,
            is_verified = EXCLUDED.is_verified,
            matched_product_ids = EXCLUDED.matched_product_ids,
            matched_products_count = EXCLUDED.matched_products_count,
            is_pharma = EXCLUDED.is_pharma,
            created_at = EXCLUDED.created_at,
            last_updated = EXCLUDED.last_updated;
    """
    values = [
        (
            p.product_id,
            p.product_id,
            p.name,
            p.price,
            p.store_id,
            p.category,
            p.category_name_variations,
            p.image_url,
            p.original_url,
            p.is_verified,
            p.matched_product_ids,
            p.matched_products_count,
            p.is_pharma,
            p.created_at,
            p.last_updated,
        )
        for p in products
    ]

    async with pool.acquire() as conn:
        async with conn.transaction():
            await conn.executemany(sql, values)


async def list_products(
    product_type: str,
    store: Optional[str],
    category: Optional[str],
    limit: int,
    offset: int,
    sort: str = "relevance",
) -> tuple[list[Product], int]:
    clauses = ["is_pharma = $1"]
    params = [product_type == "pharma"]

    if store:
        clauses.append(f"store_id = ${len(params) + 1}")
        params.append(store)
    if category:
        clauses.append(f"category ILIKE ${len(params) + 1}")
        params.append(category)

    where_sql = " AND ".join(clauses)
    order_sql = "ORDER BY matched_products_count DESC"
    if sort == "priceAsc":
        order_sql = "ORDER BY price ASC"
    elif sort == "priceDesc":
        order_sql = "ORDER BY price DESC"
    elif sort == "nameAsc":
        order_sql = "ORDER BY name ASC"

    count_sql = f"SELECT COUNT(*) FROM products WHERE {where_sql}"
    list_sql = f"""
        SELECT * FROM products
        WHERE {where_sql}
        {order_sql}
        LIMIT ${len(params) + 1} OFFSET ${len(params) + 2}
    """

    pool = await get_pool()
    async with pool.acquire() as conn:
        total = await conn.fetchval(count_sql, *params)
        rows = await conn.fetch(list_sql, *params, limit, offset)
    return [_row_to_product(r) for r in rows], int(total or 0)


async def search_products(
    query: str,
    product_type: str,
    store: Optional[str],
    category: Optional[str],
    limit: int,
    offset: int,
    sort: str = "relevance",
) -> tuple[list[Product], int]:
    clauses = ["is_pharma = $1"]
    params = [product_type == "pharma"]

    q_param = f"%{query}%"
    clauses.append(
        f"(name ILIKE ${len(params) + 1} OR EXISTS (SELECT 1 FROM unnest(category_variations) v WHERE v ILIKE ${len(params) + 1}))"
    )
    params.append(q_param)

    if store:
        clauses.append(f"store_id = ${len(params) + 1}")
        params.append(store)
    if category:
        clauses.append(f"category ILIKE ${len(params) + 1}")
        params.append(category)

    where_sql = " AND ".join(clauses)
    order_sql = "ORDER BY matched_products_count DESC"
    if sort == "priceAsc":
        order_sql = "ORDER BY price ASC"
    elif sort == "priceDesc":
        order_sql = "ORDER BY price DESC"
    elif sort == "nameAsc":
        order_sql = "ORDER BY name ASC"

    count_sql = f"SELECT COUNT(*) FROM products WHERE {where_sql}"
    list_sql = f"""
        SELECT * FROM products
        WHERE {where_sql}
        {order_sql}
        LIMIT ${len(params) + 1} OFFSET ${len(params) + 2}
    """

    pool = await get_pool()
    async with pool.acquire() as conn:
        total = await conn.fetchval(count_sql, *params)
        rows = await conn.fetch(list_sql, *params, limit, offset)
    return [_row_to_product(r) for r in rows], int(total or 0)


async def get_product_by_id(product_id: str) -> Optional[Product]:
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM products WHERE product_id = $1 OR id = $1",
            product_id,
        )
        if not row:
            return None
        return _row_to_product(row)


async def get_product_with_matches(product_id: str) -> tuple[Optional[Product], list[Product]]:
    product = await get_product_by_id(product_id)
    if not product:
        return None, []
    if not product.matched_product_ids:
        return product, []

    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT * FROM products WHERE product_id = ANY($1::text[])",
            product.matched_product_ids,
        )
    return product, [_row_to_product(r) for r in rows]


async def get_trending_products(
    limit: int = 6,
    matched_products_count_gt: Optional[int] = None,
    matched_products_count_lt: Optional[int] = None,
) -> list[Product]:
    clauses: list[str] = []
    params: list[object] = []

    if matched_products_count_gt is not None:
        clauses.append(f"matched_products_count > ${len(params) + 1}")
        params.append(matched_products_count_gt)
    if matched_products_count_lt is not None:
        clauses.append(f"matched_products_count < ${len(params) + 1}")
        params.append(matched_products_count_lt)

    if not clauses:
        # Preserve legacy trending behavior when no explicit filters are provided.
        clauses = ["matched_products_count > 2", "matched_products_count <= 5"]

    where_sql = " AND ".join(clauses)
    limit_placeholder = len(params) + 1
    sql = f"""
        SELECT * FROM products
        WHERE {where_sql}
        ORDER BY random()
        LIMIT ${limit_placeholder}
    """

    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(sql, *params, limit)

    return [_row_to_product(r) for r in rows]
