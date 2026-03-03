from __future__ import annotations

"""Favorites API router.

Endpoints:
  GET    /api/favorites           — Get user's favorite product IDs
  GET    /api/favorites/products  — Get user's favorite products with full data
  POST   /api/favorites/{id}     — Toggle favorite
  DELETE /api/favorites           — Clear all favorites
"""

from fastapi import APIRouter, Depends, HTTPException
from firebase_admin import firestore as firebase_firestore

from app.dependencies import get_current_user
from app.services.firebase_service import get_firestore_client
from app.services import product_service

router = APIRouter(prefix="/api/favorites", tags=["Favorites"])


@router.get("")
async def get_favorites(claims: dict = Depends(get_current_user)):
    """Get the current user's favorite product IDs.
    
    Mirrors Flutter's loadUserFavorites().
    """
    uid = claims["uid"]
    db = get_firestore_client()

    favorites_ref = db.collection("users").document(uid).collection("favorites")
    docs = favorites_ref.stream()

    favorite_ids = [doc.id for doc in docs]
    return {"favoriteIds": favorite_ids}


@router.get("/products")
async def get_favorite_products(claims: dict = Depends(get_current_user)):
    """Get the current user's favorite products with full product data.
    
    Mirrors Flutter's getFavoriteProducts().
    """
    uid = claims["uid"]
    db = get_firestore_client()

    favorites_ref = db.collection("users").document(uid).collection("favorites")
    docs = favorites_ref.stream()
    favorite_ids = [doc.id for doc in docs]

    if not favorite_ids:
        return {"products": []}

    # Look up each product from the cached bundle data
    products = []
    for pid in favorite_ids:
        product = await product_service.get_product_by_id(pid)
        if product:
            products.append(product)

    return {"products": products}


@router.post("/{product_id}")
async def toggle_favorite(product_id: str, claims: dict = Depends(get_current_user)):
    """Toggle a product as favorite.
    
    Mirrors Flutter's toggleFavorite() — adds if not favorited, removes if already favorited.
    """
    uid = claims["uid"]
    db = get_firestore_client()

    fav_ref = db.collection("users").document(uid).collection("favorites").document(product_id)
    fav_doc = fav_ref.get()

    if fav_doc.exists:
        fav_ref.delete()
        return {"added": False, "productId": product_id}
    else:
        fav_ref.set({
            "productId": product_id,
            "addedAt": firebase_firestore.SERVER_TIMESTAMP,
        })
        return {"added": True, "productId": product_id}


@router.delete("")
async def clear_favorites(claims: dict = Depends(get_current_user)):
    """Clear all favorites for the current user.
    
    Mirrors Flutter's clearAllFavorites().
    """
    uid = claims["uid"]
    db = get_firestore_client()

    favorites_ref = db.collection("users").document(uid).collection("favorites")
    docs = favorites_ref.stream()

    batch = db.batch()
    count = 0
    for doc in docs:
        batch.delete(doc.reference)
        count += 1

    if count > 0:
        batch.commit()

    return {"cleared": count}
