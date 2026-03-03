from __future__ import annotations

import asyncio
from typing import Optional

from app.db import init_db, close_pool
from app.services import product_service, product_db_service


async def ingest_bundle(product_type: str) -> None:
    metadata = await product_service.fetch_bundle_metadata(product_type)
    version = metadata.get("version", "")
    file_url = metadata.get("fileUrl", "")
    last_updated = metadata.get("lastUpdated") or metadata.get("exportDate")
    product_count = int(metadata.get("productCount", 0))

    existing = await product_db_service.get_bundle_version(product_type)
    if existing and existing.get("version") == version:
        print(f"✅ {product_type} bundle up-to-date (version {version})")
        return

    bundle = await product_service.fetch_bundle(product_type)
    products = product_service.parse_bundle_products(bundle, is_pharma=(product_type == "pharma"))

    await product_db_service.upsert_products(products)
    await product_db_service.set_bundle_version(
        product_type=product_type,
        version=version,
        file_url=file_url,
        last_updated_at=last_updated,
        product_count=product_count,
    )
    print(f"✅ Ingested {len(products)} {product_type} products (version {version})")


async def run_ingest(product_type: Optional[str] = None) -> None:
    await init_db()
    if product_type:
        await ingest_bundle(product_type)
    else:
        await ingest_bundle("grocery")
        await ingest_bundle("pharma")
    await close_pool()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Ingest product bundles into PostgreSQL.")
    parser.add_argument("--type", choices=["grocery", "pharma"], help="Ingest only one bundle type.")
    args = parser.parse_args()

    asyncio.run(run_ingest(args.type))
