from __future__ import annotations

"""Storage and aggregation for the fixed poster QR redirect links."""

import asyncio
import hashlib
import hmac
import re
from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from app.config import get_settings
from app.db import get_pool


CAMPAIGN = "poster_v1"
TIMEZONE_NAME = "Asia/Karachi"
TIMEZONE = ZoneInfo(TIMEZONE_NAME)
VISITOR_COOKIE_NAME = "qemat_qr_visitor"
VISITOR_COOKIE_MAX_AGE = 365 * 24 * 60 * 60

ANDROID_DESTINATION = (
    "https://play.google.com/store/apps/details?id=com.usdev.qeemat"
    "&referrer=utm_source%3Doffline_poster%26utm_medium%3Dqr"
    "%26utm_campaign%3Dposter_v1%26utm_content%3Dandroid"
)
IOS_DESTINATION = (
    "https://qemat.pk/?utm_source=offline_poster&utm_medium=qr"
    "&utm_campaign=poster_v1&utm_content=ios"
)

_BOT_USER_AGENT = re.compile(
    r"bot|crawler|spider|preview|headless|facebookexternalhit|slackbot|"
    r"discordbot|telegrambot|whatsapp|skypeuripreview|curl/|wget/",
    re.IGNORECASE,
)


def hash_visitor_id(visitor_id: str) -> str:
    secret = get_settings().qr_analytics_hmac_secret.encode("utf-8")
    return hmac.new(secret, visitor_id.encode("utf-8"), hashlib.sha256).hexdigest()


def is_automated_user_agent(user_agent: str) -> bool:
    return bool(_BOT_USER_AGENT.search(user_agent))


async def record_scan(*, platform: str, visitor_id: str, is_bot: bool) -> None:
    """Persist one scan with a tight timeout so analytics never delays the redirect."""

    async def _insert() -> None:
        pool = await get_pool()
        await pool.execute(
            """
            INSERT INTO qr_scan_events (platform, campaign, visitor_hash, is_bot)
            VALUES ($1, $2, $3, $4)
            """,
            platform,
            CAMPAIGN,
            hash_visitor_id(visitor_id),
            is_bot,
        )

    await asyncio.wait_for(
        _insert(),
        timeout=get_settings().qr_analytics_write_timeout_seconds,
    )


async def get_analytics(from_date: date, to_date: date) -> dict:
    start_at = datetime.combine(from_date, time.min, tzinfo=TIMEZONE)
    end_at = datetime.combine(to_date + timedelta(days=1), time.min, tzinfo=TIMEZONE)
    pool = await get_pool()

    totals = await pool.fetchrow(
        """
        SELECT
            COUNT(*) FILTER (WHERE NOT is_bot) AS total_visits,
            COUNT(DISTINCT visitor_hash) FILTER (WHERE NOT is_bot) AS estimated_unique_visitors,
            COUNT(*) FILTER (WHERE NOT is_bot AND platform = 'android') AS android_visits,
            COUNT(*) FILTER (WHERE NOT is_bot AND platform = 'ios') AS ios_visits,
            COUNT(*) FILTER (WHERE is_bot) AS excluded_automated_visits
        FROM qr_scan_events
        WHERE occurred_at >= $1 AND occurred_at < $2
        """,
        start_at,
        end_at,
    )
    all_time_total = await pool.fetchval(
        "SELECT COUNT(*) FROM qr_scan_events WHERE NOT is_bot"
    )
    rows = await pool.fetch(
        """
        SELECT
            (occurred_at AT TIME ZONE 'Asia/Karachi')::date AS day,
            COUNT(*) FILTER (WHERE NOT is_bot) AS total_visits,
            COUNT(DISTINCT visitor_hash) FILTER (WHERE NOT is_bot) AS estimated_unique_visitors,
            COUNT(*) FILTER (WHERE NOT is_bot AND platform = 'android') AS android_visits,
            COUNT(*) FILTER (WHERE NOT is_bot AND platform = 'ios') AS ios_visits
        FROM qr_scan_events
        WHERE occurred_at >= $1 AND occurred_at < $2
        GROUP BY day
        ORDER BY day
        """,
        start_at,
        end_at,
    )

    points_by_date = {row["day"]: row for row in rows}
    daily = []
    current = from_date
    while current <= to_date:
        row = points_by_date.get(current)
        daily.append(
            {
                "date": current,
                "total_visits": int(row["total_visits"]) if row else 0,
                "estimated_unique_visitors": int(row["estimated_unique_visitors"]) if row else 0,
                "android_visits": int(row["android_visits"]) if row else 0,
                "ios_visits": int(row["ios_visits"]) if row else 0,
            }
        )
        current += timedelta(days=1)

    return {
        "period": {
            "from_date": from_date,
            "to_date": to_date,
            "timezone": TIMEZONE_NAME,
        },
        "totals": {
            "total_visits": int(totals["total_visits"] or 0),
            "estimated_unique_visitors": int(totals["estimated_unique_visitors"] or 0),
            "android_visits": int(totals["android_visits"] or 0),
            "ios_visits": int(totals["ios_visits"] or 0),
            "excluded_automated_visits": int(totals["excluded_automated_visits"] or 0),
        },
        "all_time_total_visits": int(all_time_total or 0),
        "daily": daily,
    }
