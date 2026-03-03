from __future__ import annotations

"""Products API router.

Endpoints:
  GET  /api/products/metadata         — Bundle metadata
  GET  /api/products/metadata/pharma  — Pharma bundle metadata
  GET  /api/products/bundle           — Download full bundle JSON
  GET  /api/products/search           — Server-side search
  GET  /api/products/trending         — Trending products
  GET  /api/products                  — Filtered product list
  GET  /api/products/{productId}      — Single product
  GET  /api/products/{productId}/matches — Product + matched items
"""

from fastapi import APIRouter, Query, HTTPException
from typing import Optional

from app.models.product import (
    Product,
    ProductResponse,
    ProductListResponse,
    ProductWithMatchesResponse,
    TrendingResponse,
)
from app.services import product_service

router = APIRouter(prefix="/api/products", tags=["Products"])


@router.get("/metadata")
async def get_product_metadata(product_type: str = Query("grocery", alias="type", enum=["grocery", "pharma"])):
    """Get bundle metadata (version, fileUrl, productCount).
    
    Proxies the existing Firebase Cloud Function.
    """
    try:
        metadata = await product_service.fetch_bundle_metadata(product_type)
        return metadata
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch metadata: {str(e)}")


@router.get("/metadata/pharma")
async def get_pharma_metadata():
    """Get pharmaceuticals bundle metadata. Convenience alias."""
    try:
        metadata = await product_service.fetch_bundle_metadata("pharma")
        return metadata
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch pharma metadata: {str(e)}")


@router.get("/bundle")
async def get_bundle(product_type: str = Query("grocery", alias="type", enum=["grocery", "pharma"])):
    """Download the full product bundle JSON (cached server-side).
    
    Returns the same structure as the Firebase Cloud Function bundle.
    """
    try:
        bundle_data = await product_service.fetch_bundle(product_type)
        return bundle_data
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch bundle: {str(e)}")


@router.get("/search", response_model=ProductListResponse)
async def search_products(
    q: str = Query(..., min_length=1, description="Search query"),
    product_type: str = Query("grocery", alias="type", enum=["grocery", "pharma"]),
    store: Optional[str] = Query(None, description="Filter by store ID"),
    category: Optional[str] = Query(None, description="Filter by category"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    """Search products by name and category variations (includes Urdu/Roman Urdu).
    
    Server-side search — much faster than Flutter's client-side filtering.
    """
    products, total = await product_service.search_products(
        query=q,
        product_type=product_type,
        store=store,
        category=category,
        page=page,
        limit=limit,
    )
    pages = (total + limit - 1) // limit if limit > 0 else 1
    return ProductListResponse(products=products, total=total, page=page, pages=pages)


@router.get("/trending", response_model=TrendingResponse)
async def get_trending():
    """Get trending products (daily cached, randomized).
    
    Products with 2 < matched_products_count <= 5.
    """
    products = await product_service.get_trending_products()
    return TrendingResponse(products=products)


@router.get("", response_model=ProductListResponse)
async def list_products(
    product_type: str = Query("grocery", alias="type", enum=["grocery", "pharma"]),
    store: Optional[str] = Query(None, description="Filter by store ID"),
    category: Optional[str] = Query(None, description="Filter by category"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    """List products with optional filters."""
    products, total = await product_service.get_products_filtered(
        product_type=product_type,
        store=store,
        category=category,
        page=page,
        limit=limit,
    )
    pages = (total + limit - 1) // limit if limit > 0 else 1
    return ProductListResponse(products=products, total=total, page=page, pages=pages)


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str):
    """Get a single product by ID."""
    product = await product_service.get_product_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return ProductResponse(product=product)


@router.get("/{product_id}/matches", response_model=ProductWithMatchesResponse)
async def get_product_matches(product_id: str):
    """Get a product with its matched products (same item at different stores)."""
    try:
        product, matches = await product_service.get_product_with_matches(product_id)
        return ProductWithMatchesResponse(product=product, matches=matches)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
