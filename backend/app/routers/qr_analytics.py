from __future__ import annotations

"""Public QR redirects and the protected QR analytics report."""

import logging
import secrets
from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import RedirectResponse

from app.dependencies import get_qr_analytics_admin
from app.models.qr_analytics import QrAnalyticsResponse
from app.services import qr_analytics_service


logger = logging.getLogger(__name__)
router = APIRouter(tags=["QR Tracking"])


async def _tracked_redirect(request: Request, *, platform: str, destination: str) -> RedirectResponse:
    existing_visitor_id = request.cookies.get(qr_analytics_service.VISITOR_COOKIE_NAME)
    visitor_id = existing_visitor_id or secrets.token_urlsafe(32)
    user_agent = request.headers.get("user-agent", "")

    try:
        await qr_analytics_service.record_scan(
            platform=platform,
            visitor_id=visitor_id,
            is_bot=qr_analytics_service.is_automated_user_agent(user_agent),
        )
    except Exception:
        logger.exception("Failed to record %s QR redirect", platform)

    response = RedirectResponse(destination, status_code=302)
    response.headers["Cache-Control"] = "no-store, max-age=0"
    response.headers["Pragma"] = "no-cache"
    if existing_visitor_id is None:
        response.set_cookie(
            qr_analytics_service.VISITOR_COOKIE_NAME,
            visitor_id,
            max_age=qr_analytics_service.VISITOR_COOKIE_MAX_AGE,
            secure=True,
            httponly=True,
            samesite="lax",
            path="/",
        )
    return response


@router.get("/a", include_in_schema=True)
async def redirect_android(request: Request) -> RedirectResponse:
    return await _tracked_redirect(
        request,
        platform="android",
        destination=qr_analytics_service.ANDROID_DESTINATION,
    )


@router.get("/i", include_in_schema=True)
async def redirect_ios(request: Request) -> RedirectResponse:
    return await _tracked_redirect(
        request,
        platform="ios",
        destination=qr_analytics_service.IOS_DESTINATION,
    )


@router.get(
    "/api/admin/qr-analytics",
    response_model=QrAnalyticsResponse,
    response_model_by_alias=True,
)
async def qr_analytics_report(
    from_date: date | None = Query(default=None, alias="from"),
    to_date: date | None = Query(default=None, alias="to"),
    _admin: dict = Depends(get_qr_analytics_admin),
) -> QrAnalyticsResponse:
    today = datetime.now(qr_analytics_service.TIMEZONE).date()
    effective_to = to_date or today
    effective_from = from_date or (effective_to - timedelta(days=29))

    if effective_to < effective_from:
        raise HTTPException(status_code=422, detail="The 'to' date must not be earlier than 'from'")
    if (effective_to - effective_from).days > 365:
        raise HTTPException(status_code=422, detail="Date range cannot exceed one year")

    data = await qr_analytics_service.get_analytics(effective_from, effective_to)
    return QrAnalyticsResponse.model_validate(data)
