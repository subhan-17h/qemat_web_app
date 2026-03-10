from __future__ import annotations

"""Product service — bundle fetching, caching, search, trending.

Mirrors the logic from Flutter's product_service.dart (1158 lines)
into a server-side Python implementation.
"""

import httpx
from typing import Optional

from app.config import get_settings
from app.models.product import Product, parse_product_from_raw
from app.services.cache_service import cache
from app.services.firebase_service import get_storage_bucket
from app.services import product_db_service

# Cache keys
GROCERY_BUNDLE_KEY = "grocery_bundle"
PHARMA_BUNDLE_KEY = "pharma_bundle"
GROCERY_PRODUCTS_KEY = "grocery_products"
PHARMA_PRODUCTS_KEY = "pharma_products"
GROCERY_METADATA_KEY = "grocery_metadata"
PHARMA_METADATA_KEY = "pharma_metadata"
TRENDING_KEY = "trending_products"

# Valid store IDs
VALID_STORES = ["Al-Fatah", "Carrefour", "Imtiaz", "Jalal Sons", "Metro", "Rainbow"]


async def fetch_bundle_metadata(product_type: str = "grocery") -> dict:
    """Fetch bundle metadata from the existing Cloud Function.
    
    Mirrors Flutter's fetchBundleMetadata() and fetchPharmaceuticalsMetadata().
    """
    settings = get_settings()

    if product_type == "pharma":
        cache_key = PHARMA_METADATA_KEY
        url = settings.pharma_metadata_url
    else:
        cache_key = GROCERY_METADATA_KEY
        url = settings.product_metadata_url

    # Check cache
    cached = cache.get(cache_key)
    if cached:
        return cached

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(url)
        response.raise_for_status()
        data = response.json()

    metadata = data.get("metadata", data)
    cache.set(cache_key, metadata, ttl=settings.bundle_cache_ttl)
    return metadata


async def fetch_bundle(product_type: str = "grocery") -> dict:
    """Download the full product bundle JSON.
    
    Mirrors Flutter's _downloadAndParseBundle().
    """
    settings = get_settings()
    products_key = PHARMA_PRODUCTS_KEY if product_type == "pharma" else GROCERY_PRODUCTS_KEY
    bundle_key = PHARMA_BUNDLE_KEY if product_type == "pharma" else GROCERY_BUNDLE_KEY

    # Check cache for raw bundle first
    cached_bundle = cache.get(bundle_key)
    if cached_bundle:
        return cached_bundle

    # Fetch metadata to get download URL
    metadata = await fetch_bundle_metadata(product_type)
    file_url = metadata.get("fileUrl", "")
    if not file_url:
        raise ValueError("No fileUrl in bundle metadata")

    # Download bundle
    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.get(file_url)
        response.raise_for_status()
        bundle_data = response.json()

    # Parse products and cache both raw bundle and parsed products
    products = _parse_bundle_products(bundle_data, is_pharma=(product_type == "pharma"))
    cache.set(bundle_key, bundle_data, ttl=settings.bundle_cache_ttl)
    cache.set(products_key, products, ttl=settings.bundle_cache_ttl)

    return bundle_data


async def get_all_products(product_type: str = "grocery") -> list[Product]:
    """Get all products (from cached bundle).
    
    Mirrors Flutter's getProducts() and getPharmaceuticals().
    """
    products_key = PHARMA_PRODUCTS_KEY if product_type == "pharma" else GROCERY_PRODUCTS_KEY

    cached = cache.get(products_key)
    if cached:
        return cached

    # Trigger bundle download if not cached
    await fetch_bundle(product_type)
    return cache.get(products_key) or []


async def search_products(
    query: str,
    product_type: str = "grocery",
    store: Optional[str] = None,
    category: Optional[str] = None,
    offset: int = 0,
    limit: int = 20,
    sort: str = "relevance",
) -> tuple[list[Product], int]:
    """Server-side product search from DB."""
    return await product_db_service.search_products(
        query=query,
        product_type=product_type,
        store=store,
        category=category,
        limit=limit,
        offset=offset,
        sort=sort,
    )


async def get_products_filtered(
    product_type: str = "grocery",
    store: Optional[str] = None,
    category: Optional[str] = None,
    offset: int = 0,
    limit: int = 20,
    sort: str = "relevance",
) -> tuple[list[Product], int]:
    """Get products with optional filtering from DB."""
    return await product_db_service.list_products(
        product_type=product_type,
        store=store,
        category=category,
        limit=limit,
        offset=offset,
        sort=sort,
    )


async def get_product_by_id(product_id: str) -> Optional[Product]:
    """Get a single product by product_id or document ID from DB."""
    return await product_db_service.get_product_by_id(product_id)


async def get_product_with_matches(product_id: str) -> tuple[Product, list[Product]]:
    """Get a product and its matched products (same item at different stores).
    
    Mirrors Flutter's getProductWithMatches().
    """
    product, matches = await product_db_service.get_product_with_matches(product_id)
    if not product:
        raise ValueError(f"Product not found: {product_id}")
    return product, matches


async def get_trending_products(
    limit: int = 6,
    matched_products_count_gt: Optional[int] = None,
    matched_products_count_lt: Optional[int] = None,
) -> list[Product]:
    """Get trending products from DB."""
    return await product_db_service.get_trending_products(
        limit=limit,
        matched_products_count_gt=matched_products_count_gt,
        matched_products_count_lt=matched_products_count_lt,
    )


def parse_bundle_products(bundle_data: dict, is_pharma: bool = False) -> list[Product]:
    """Expose bundle parsing for ingestion jobs."""
    return _parse_bundle_products(bundle_data, is_pharma=is_pharma)


def resolve_image_url(image_url: str) -> str:
    """Convert gs:// URLs to signed HTTPS download URLs.
    
    Mirrors the Flutter app's image URL resolution.
    """
    if not image_url or not image_url.startswith("gs://"):
        return image_url

    try:
        # Parse gs://bucket/path
        parts = image_url.replace("gs://", "").split("/", 1)
        if len(parts) < 2:
            return image_url

        blob_path = parts[1]
        bucket = get_storage_bucket()
        blob = bucket.blob(blob_path)

        from datetime import timedelta
        url = blob.generate_signed_url(expiration=timedelta(hours=24))
        return url
    except Exception:
        return image_url


def _parse_bundle_products(bundle_data: dict, is_pharma: bool = False) -> list[Product]:
    """Parse bundle JSON into Product objects.
    
    Mirrors Flutter's _parseBundleProducts().
    """
    raw_products = bundle_data.get("products", [])
    products = []

    for data in raw_products:
        product = parse_product_from_raw(data)
        product.image_url = resolve_image_url(product.image_url)
        product.is_pharma = is_pharma
        products.append(product)

    return products
