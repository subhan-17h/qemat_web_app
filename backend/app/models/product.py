"""Pydantic models for Product data."""

from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime


class ProductBase(BaseModel):
    """Base product fields shared across responses."""
    product_id: str = Field(..., alias="productId")
    name: str
    price: float
    store_id: str = Field(..., alias="storeId")
    category: str
    category_name_variations: List[str] = Field(default_factory=list, alias="categoryNameVariations")
    image_url: str = Field("", alias="imageUrl")
    original_url: str = Field("", alias="originalUrl")
    is_verified: bool = Field(False, alias="isVerified")
    matched_product_ids: List[str] = Field(default_factory=list, alias="matchedProductIds")
    matched_products_count: int = Field(0, alias="matchedProductsCount")

    model_config = {"populate_by_name": True}


class Product(ProductBase):
    """Full product model with document ID and timestamps."""
    id: str = ""  # Firestore document ID
    created_at: Optional[datetime] = Field(None, alias="createdAt")
    last_updated: Optional[datetime] = Field(None, alias="lastUpdated")
    is_pharma: bool = Field(False, alias="isPharma")


class ProductResponse(BaseModel):
    """Single product API response."""
    product: Product


class ProductListResponse(BaseModel):
    """Paginated product list API response."""
    products: List[Product]
    total: int
    page: int = 1
    pages: int = 1


class ProductWithMatchesResponse(BaseModel):
    """Product with its matched (same product, different stores) items."""
    product: Product
    matches: List[Product]


class BundleMetadataResponse(BaseModel):
    """Bundle metadata from Cloud Function."""
    file_url: str = Field(..., alias="fileUrl")
    version: str
    product_count: int = Field(0, alias="productCount")
    last_updated: str = Field("", alias="lastUpdated")
    export_date: str = Field("", alias="exportDate")

    model_config = {"populate_by_name": True}


class TrendingResponse(BaseModel):
    """Trending products response."""
    products: List[Product]


# --- Helper: parse raw Firestore/bundle data into Product ---

def parse_product_from_raw(data: dict, doc_id: str = "") -> Product:
    """Parse a product from Firestore document or bundle JSON."""
    import re

    # Handle name field (product_name for pharma, name for grocery)
    name = data.get("product_name") or data.get("name") or ""

    # Parse price from various formats
    raw_price = data.get("price", 0)
    if isinstance(raw_price, str):
        # Handle price strings like "Rs. 1,250" and "PKR 1250.50"
        normalized = raw_price.replace(",", "")
        match = re.search(r"\d+(?:\.\d+)?", normalized)
        price = float(match.group(0)) if match else 0.0
    elif isinstance(raw_price, (int, float)):
        price = float(raw_price)
    else:
        price = 0.0

    # Parse timestamps
    created_at = _parse_timestamp(data.get("created_at"))
    last_updated = _parse_timestamp(data.get("last_updated"))

    # Parse matched products
    matched = data.get("matched_products", [])
    if isinstance(matched, list):
        matched_ids = [str(m) for m in matched if m]
    else:
        matched_ids = []

    # Parse category variations
    variations = data.get("categoryNameVariations", [])
    if isinstance(variations, str):
        variations = [variations]
    elif not isinstance(variations, list):
        variations = []

    return Product(
        id=doc_id or data.get("document_id", ""),
        product_id=data.get("product_id", ""),
        name=name,
        price=price,
        store_id=data.get("store_id", ""),
        category=data.get("category", ""),
        category_name_variations=[str(v) for v in variations],
        image_url=data.get("image_url", ""),
        original_url=data.get("original_url", ""),
        is_verified=data.get("is_verified", False),
        matched_product_ids=matched_ids,
        matched_products_count=int(data.get("matched_products_count", 0)),
        created_at=created_at,
        last_updated=last_updated,
        is_pharma=False,
    )


def _parse_timestamp(value) -> Optional[datetime]:
    """Parse timestamp from various formats."""
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        except (ValueError, TypeError):
            return None
    # Firebase Timestamp objects have a datetime() method via firebase-admin
    if hasattr(value, "datetime"):
        return value.datetime()
    return None
