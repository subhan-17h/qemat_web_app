from __future__ import annotations

"""Analytics API router.

Endpoints:
  POST /api/analytics/purchase — Track a product purchase
  POST /api/analytics/report   — Report a price issue
  POST /api/analytics/action   — Track a general user action
"""

from fastapi import APIRouter, Depends
from typing import Optional

from app.dependencies import get_optional_user
from app.models.analytics import PurchaseRequest, PriceReportRequest, UserActionRequest, AnalyticsResponse
from app.services import analytics_service

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.post("/purchase", response_model=AnalyticsResponse)
async def track_purchase(
    request: PurchaseRequest,
    user: Optional[dict] = Depends(get_optional_user),
):
    """Track when user marks 'I bought this'.
    
    Supports both authenticated and guest users.
    Mirrors Flutter's AnalyticsService.trackPurchase().
    """
    success = await analytics_service.track_purchase(
        product_id=request.product_id,
        user_id=user["uid"] if user else None,
        user_email=user.get("email") if user else None,
        source=request.source,
    )
    return AnalyticsResponse(success=success)


@router.post("/report", response_model=AnalyticsResponse)
async def track_report(
    request: PriceReportRequest,
    user: Optional[dict] = Depends(get_optional_user),
):
    """Report a price issue on a product.
    
    Supports both authenticated and guest users.
    Mirrors Flutter's AnalyticsService.trackPriceReport().
    """
    success = await analytics_service.track_price_report(
        product_id=request.product_id,
        reason=request.reason,
        user_id=user["uid"] if user else None,
        user_email=user.get("email") if user else None,
        source=request.source,
    )
    return AnalyticsResponse(success=success)


@router.post("/action", response_model=AnalyticsResponse)
async def track_action(
    request: UserActionRequest,
    user: Optional[dict] = Depends(get_optional_user),
):
    """Track a general user action.
    
    Mirrors Flutter's AnalyticsService.trackUserAction().
    """
    await analytics_service.track_user_action(
        action=request.action,
        user_id=user["uid"] if user else None,
        data=request.data,
    )
    return AnalyticsResponse(success=True)
