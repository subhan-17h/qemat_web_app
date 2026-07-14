"""Response models for QR redirect analytics."""

from datetime import date

from pydantic import BaseModel, Field


class QrAnalyticsPeriod(BaseModel):
    from_date: date = Field(alias="from")
    to_date: date = Field(alias="to")
    timezone: str

    model_config = {"populate_by_name": True}


class QrAnalyticsTotals(BaseModel):
    total_visits: int = Field(alias="totalVisits")
    estimated_unique_visitors: int = Field(alias="estimatedUniqueVisitors")
    android_visits: int = Field(alias="androidVisits")
    ios_visits: int = Field(alias="iosVisits")
    excluded_automated_visits: int = Field(alias="excludedAutomatedVisits")

    model_config = {"populate_by_name": True}


class QrAnalyticsDailyPoint(BaseModel):
    date: date
    total_visits: int = Field(alias="totalVisits")
    estimated_unique_visitors: int = Field(alias="estimatedUniqueVisitors")
    android_visits: int = Field(alias="androidVisits")
    ios_visits: int = Field(alias="iosVisits")

    model_config = {"populate_by_name": True}


class QrAnalyticsResponse(BaseModel):
    period: QrAnalyticsPeriod
    totals: QrAnalyticsTotals
    all_time_total_visits: int = Field(alias="allTimeTotalVisits")
    daily: list[QrAnalyticsDailyPoint]

    model_config = {"populate_by_name": True}
