from __future__ import annotations

"""Analytics service — purchase tracking, price reports, user actions.

Mirrors Flutter's analytics_service.dart with Firestore batch writes.
"""

import random
from datetime import datetime, timezone
from typing import Optional
from firebase_admin import firestore as firebase_firestore

from app.services.firebase_service import get_firestore_client


async def track_purchase(
    product_id: str,
    user_id: Optional[str] = None,
    user_email: Optional[str] = None,
    source: str = "product_details_screen",
    additional_data: Optional[dict] = None,
) -> bool:
    """Track when user marks 'I bought this'.
    
    Mirrors Flutter's trackPurchase() with batch writes.
    Supports both authenticated and guest users.
    """
    if not product_id:
        return False

    try:
        db = get_firestore_client()
        timestamp = datetime.now(timezone.utc)

        # Generate session/doc ID (mirrors Flutter's guest session logic)
        session_id = user_id or f"guest_{int(timestamp.timestamp() * 1000)}_{random.randint(0, 9999)}"
        doc_id = f"{int(timestamp.timestamp() * 1000)}_{session_id}"

        purchase_data = {
            "productId": product_id,
            "userId": user_id,
            "userEmail": user_email,
            "sessionId": session_id,
            "isGuestUser": user_id is None,
            "timestamp": timestamp,
            "source": source,
        }
        if additional_data:
            purchase_data.update(additional_data)

        # Batch write for atomic consistency (mirrors Flutter's batch.commit())
        batch = db.batch()

        # Add purchase record
        purchase_ref = (
            db.collection("user_analytics")
            .document("product_purchases")
            .collection(product_id)
            .document(doc_id)
        )
        batch.set(purchase_ref, purchase_data)

        # Update product stats (atomic increment)
        stats_ref = (
            db.collection("user_analytics")
            .document("product_stats")
            .collection("stats")
            .document(product_id)
        )
        batch.set(stats_ref, {
            "productId": product_id,
            "total_purchases": firebase_firestore.Increment(1),
            "guest_purchases": firebase_firestore.Increment(1 if user_id is None else 0),
            "registered_purchases": firebase_firestore.Increment(1 if user_id else 0),
            "last_purchase": timestamp,
            "updated_at": timestamp,
        }, merge=True)

        batch.commit()
        return True

    except Exception:
        return False


async def track_price_report(
    product_id: str,
    reason: str = "general_price_issue",
    user_id: Optional[str] = None,
    user_email: Optional[str] = None,
    source: str = "product_details_screen",
    additional_data: Optional[dict] = None,
) -> bool:
    """Track when user reports a price issue.
    
    Mirrors Flutter's trackPriceReport() with batch writes.
    """
    if not product_id:
        return False

    try:
        db = get_firestore_client()
        timestamp = datetime.now(timezone.utc)

        session_id = user_id or f"guest_{int(timestamp.timestamp() * 1000)}_{random.randint(0, 9999)}"
        doc_id = f"{int(timestamp.timestamp() * 1000)}_{session_id}"

        report_data = {
            "productId": product_id,
            "userId": user_id,
            "userEmail": user_email,
            "sessionId": session_id,
            "isGuestUser": user_id is None,
            "timestamp": timestamp,
            "reason": reason,
            "status": "pending",
            "source": source,
        }
        if additional_data:
            report_data.update(additional_data)

        batch = db.batch()

        # Add report record
        report_ref = (
            db.collection("user_analytics")
            .document("product_reports")
            .collection(product_id)
            .document(doc_id)
        )
        batch.set(report_ref, report_data)

        # Update product stats
        stats_ref = (
            db.collection("user_analytics")
            .document("product_stats")
            .collection("stats")
            .document(product_id)
        )
        batch.set(stats_ref, {
            "productId": product_id,
            "total_reports": firebase_firestore.Increment(1),
            "guest_reports": firebase_firestore.Increment(1 if user_id is None else 0),
            "registered_reports": firebase_firestore.Increment(1 if user_id else 0),
            "last_report": timestamp,
            "updated_at": timestamp,
        }, merge=True)

        batch.commit()
        return True

    except Exception:
        return False


async def track_user_action(
    action: str,
    user_id: Optional[str] = None,
    data: Optional[dict] = None,
) -> None:
    """Track general user actions.
    
    Mirrors Flutter's trackUserAction().
    """
    try:
        db = get_firestore_client()
        session_id = user_id or f"guest_{int(datetime.now(timezone.utc).timestamp() * 1000)}_{random.randint(0, 9999)}"

        db.collection("user_analytics").document("user_actions").collection("actions").add({
            "action": action,
            "userId": user_id,
            "sessionId": session_id,
            "isGuestUser": user_id is None,
            "timestamp": datetime.now(timezone.utc),
            "data": data,
        })
    except Exception:
        pass  # Silent fail for non-critical tracking (mirrors Flutter behavior)
