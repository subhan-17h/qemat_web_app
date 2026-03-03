"""Pydantic models for Analytics data."""

from typing import Optional, Dict
from pydantic import BaseModel, Field


class PurchaseRequest(BaseModel):
    """Track a product purchase."""
    product_id: str = Field(..., alias="productId")
    source: str = "product_details_screen"

    model_config = {"populate_by_name": True}


class PriceReportRequest(BaseModel):
    """Report a price issue."""
    product_id: str = Field(..., alias="productId")
    reason: str = "general_price_issue"  # price_higher, price_lower, general_price_issue
    source: str = "product_details_screen"

    model_config = {"populate_by_name": True}


class UserActionRequest(BaseModel):
    """Track a general user action."""
    action: str
    data: Optional[Dict] = None


class AnalyticsResponse(BaseModel):
    """Generic analytics response."""
    success: bool
