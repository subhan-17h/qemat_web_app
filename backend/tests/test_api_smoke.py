from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Optional, Tuple

import pytest
from fastapi.testclient import TestClient

import app.main as main_mod
import app.dependencies as deps
import app.routers.favorites as favorites_router
import app.services.analytics_service as analytics_service
import app.services.auth_service as auth_service
import app.services.product_service as product_service
from app.models.product import Product
from app.models.user import UserResponse


@dataclass
class FakeSnapshot:
    id: str
    data: Optional[dict]
    reference: "FakeDocument"

    @property
    def exists(self) -> bool:
        return self.data is not None

    def to_dict(self) -> dict:
        return self.data or {}


class FakeDocument:
    def __init__(self, db: "FakeDB", path: Tuple[str, ...]):
        self.db = db
        self.path = path

    def collection(self, name: str) -> "FakeCollection":
        return FakeCollection(self.db, self.path + (name,))

    def get(self) -> FakeSnapshot:
        return FakeSnapshot(id=self.path[-1], data=self.db.docs.get(self.path), reference=self)

    def set(self, data: dict, merge: bool = False) -> None:
        if merge and self.path in self.db.docs:
            self.db.docs[self.path].update(data)
        else:
            self.db.docs[self.path] = dict(data)

    def delete(self) -> None:
        self.db.docs.pop(self.path, None)


class FakeCollection:
    def __init__(self, db: "FakeDB", path: Tuple[str, ...]):
        self.db = db
        self.path = path

    def document(self, doc_id: str) -> FakeDocument:
        return FakeDocument(self.db, self.path + (doc_id,))

    def stream(self):
        prefix_len = len(self.path)
        for path, data in list(self.db.docs.items()):
            if len(path) == prefix_len + 1 and path[:prefix_len] == self.path:
                yield FakeSnapshot(id=path[-1], data=data, reference=FakeDocument(self.db, path))


class FakeBatch:
    def __init__(self):
        self.to_delete = []

    def delete(self, ref: FakeDocument) -> None:
        self.to_delete.append(ref)

    def commit(self) -> None:
        for ref in self.to_delete:
            ref.delete()


class FakeDB:
    def __init__(self):
        self.docs: Dict[Tuple[str, ...], dict] = {}

    def collection(self, name: str) -> FakeCollection:
        return FakeCollection(self, (name,))

    def batch(self) -> FakeBatch:
        return FakeBatch()


@pytest.fixture
def sample_products() -> tuple[Product, Product]:
    p1 = Product(
        id="doc1",
        product_id="ALFATAH_milk_1kg",
        name="Olpers Milk 1L",
        price=320,
        store_id="Al-Fatah",
        category="Milk",
        category_name_variations=["Milk", "Doodh"],
        image_url="https://example.com/milk.jpg",
        original_url="https://store.example/item",
        is_verified=True,
        matched_product_ids=["IMTIAZ_milk_1kg"],
        matched_products_count=1,
        is_pharma=False,
    )
    p2 = Product(
        id="doc2",
        product_id="IMTIAZ_milk_1kg",
        name="Olpers Milk 1L",
        price=315,
        store_id="Imtiaz",
        category="Milk",
        category_name_variations=["Milk", "Doodh"],
        image_url="https://example.com/milk2.jpg",
        original_url="https://store.example/item2",
        is_verified=True,
        matched_product_ids=[],
        matched_products_count=1,
        is_pharma=False,
    )
    return p1, p2


@pytest.fixture
def fake_db() -> FakeDB:
    db = FakeDB()
    db.docs[("users", "uid-123", "favorites", "ALFATAH_milk_1kg")] = {"productId": "ALFATAH_milk_1kg"}
    return db


@pytest.fixture
def client(monkeypatch: pytest.MonkeyPatch, sample_products: tuple[Product, Product], fake_db: FakeDB):
    p1, p2 = sample_products

    # Prevent real Firebase initialization during app lifespan.
    monkeypatch.setattr(main_mod, "init_firebase", lambda: None)
    monkeypatch.setattr(favorites_router, "get_firestore_client", lambda: fake_db)

    async def mock_fetch_bundle_metadata(product_type: str = "grocery"):
        return {
            "fileUrl": "https://example.com/bundle.json",
            "version": "v1.0.0",
            "productCount": 2,
            "lastUpdated": "2026-03-01T00:00:00Z",
            "exportDate": "2026-03-01T00:00:00Z",
            "type": product_type,
        }

    async def mock_fetch_bundle(product_type: str = "grocery"):
        return {
            "version": "v1.0.0",
            "productCount": 2,
            "products": [
                {"product_id": p1.product_id, "name": p1.name, "price": p1.price, "store_id": p1.store_id, "category": p1.category},
                {"product_id": p2.product_id, "name": p2.name, "price": p2.price, "store_id": p2.store_id, "category": p2.category},
            ],
        }

    async def mock_search_products(**kwargs):
        return [p1], 1

    async def mock_get_trending_products():
        return [p1, p2]

    async def mock_get_products_filtered(**kwargs):
        return [p1, p2], 2

    async def mock_get_product_by_id(product_id: str):
        if product_id in {p1.product_id, p1.id}:
            return p1
        if product_id in {p2.product_id, p2.id}:
            return p2
        return None

    async def mock_get_product_with_matches(product_id: str):
        product = await mock_get_product_by_id(product_id)
        if product is None:
            raise ValueError(f"Product not found: {product_id}")
        return product, [p2] if product.product_id == p1.product_id else []

    monkeypatch.setattr(product_service, "fetch_bundle_metadata", mock_fetch_bundle_metadata)
    monkeypatch.setattr(product_service, "fetch_bundle", mock_fetch_bundle)
    monkeypatch.setattr(product_service, "search_products", mock_search_products)
    monkeypatch.setattr(product_service, "get_trending_products", mock_get_trending_products)
    monkeypatch.setattr(product_service, "get_products_filtered", mock_get_products_filtered)
    monkeypatch.setattr(product_service, "get_product_by_id", mock_get_product_by_id)
    monkeypatch.setattr(product_service, "get_product_with_matches", mock_get_product_with_matches)

    user_profile = UserResponse(
        uid="uid-123",
        email="user@example.com",
        username="rowdy",
        displayName="Rowdy",
        photoURL="https://example.com/photo.jpg",
    )

    async def mock_create_user_with_email(email: str, password: str):
        return {"user": user_profile, "token": "token-123"}

    async def mock_sign_in_with_email(email: str, password: str):
        return {"user": user_profile, "token": "id-token-123"}

    async def mock_verify_firebase_token(token: str):
        return {"uid": "uid-123", "email": "user@example.com", "name": "Rowdy", "picture": "https://example.com/photo.jpg"}

    async def mock_get_or_create_user(uid: str, email: str, display_name=None, photo_url=None):
        return user_profile

    async def mock_get_user_profile(uid: str):
        return user_profile

    async def mock_is_username_available(username: str):
        return username != "taken"

    async def mock_update_username(uid: str, username: str, display_name: str):
        if username == "taken":
            raise ValueError("Username is already taken")
        return None

    async def mock_logout_user(uid: str):
        return None

    monkeypatch.setattr(auth_service, "create_user_with_email", mock_create_user_with_email)
    monkeypatch.setattr(auth_service, "sign_in_with_email", mock_sign_in_with_email)
    monkeypatch.setattr(auth_service, "verify_firebase_token", mock_verify_firebase_token)
    monkeypatch.setattr(auth_service, "get_or_create_user", mock_get_or_create_user)
    monkeypatch.setattr(auth_service, "get_user_profile", mock_get_user_profile)
    monkeypatch.setattr(auth_service, "is_username_available", mock_is_username_available)
    monkeypatch.setattr(auth_service, "update_username", mock_update_username)
    monkeypatch.setattr(auth_service, "logout_user", mock_logout_user)

    async def mock_track_purchase(**kwargs):
        return True

    async def mock_track_price_report(**kwargs):
        return True

    async def mock_track_user_action(**kwargs):
        return None

    monkeypatch.setattr(analytics_service, "track_purchase", mock_track_purchase)
    monkeypatch.setattr(analytics_service, "track_price_report", mock_track_price_report)
    monkeypatch.setattr(analytics_service, "track_user_action", mock_track_user_action)

    app = main_mod.app
    app.dependency_overrides[deps.get_current_user] = lambda: {"uid": "uid-123", "email": "user@example.com"}
    app.dependency_overrides[deps.get_optional_user] = lambda: {"uid": "uid-123", "email": "user@example.com"}

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


def test_health_endpoints(client: TestClient):
    root = client.get("/")
    assert root.status_code == 200
    assert root.json()["status"] == "healthy"

    health = client.get("/health")
    assert health.status_code == 200
    assert health.json()["status"] == "healthy"


def test_product_endpoints(client: TestClient):
    metadata = client.get("/api/products/metadata", params={"type": "grocery"})
    assert metadata.status_code == 200
    assert metadata.json()["fileUrl"] == "https://example.com/bundle.json"

    pharma_metadata = client.get("/api/products/metadata/pharma")
    assert pharma_metadata.status_code == 200
    assert pharma_metadata.json()["type"] == "pharma"

    bundle = client.get("/api/products/bundle", params={"type": "grocery"})
    assert bundle.status_code == 200
    assert len(bundle.json()["products"]) == 2

    search = client.get("/api/products/search", params={"q": "milk", "type": "grocery"})
    assert search.status_code == 200
    assert search.json()["total"] == 1

    trending = client.get("/api/products/trending")
    assert trending.status_code == 200
    assert len(trending.json()["products"]) == 2

    all_products = client.get("/api/products", params={"type": "grocery"})
    assert all_products.status_code == 200
    assert all_products.json()["total"] == 2

    single = client.get("/api/products/ALFATAH_milk_1kg")
    assert single.status_code == 200
    assert single.json()["product"]["productId"] == "ALFATAH_milk_1kg"

    matches = client.get("/api/products/ALFATAH_milk_1kg/matches")
    assert matches.status_code == 200
    assert len(matches.json()["matches"]) == 1

    not_found = client.get("/api/products/not-found")
    assert not_found.status_code == 404


def test_auth_endpoints(client: TestClient):
    register = client.post("/api/auth/register", json={"email": "new@example.com", "password": "pass1234"})
    assert register.status_code == 200
    assert "user" in register.json()
    assert "token" in register.json()

    login = client.post("/api/auth/login", json={"email": "user@example.com", "password": "pass1234"})
    assert login.status_code == 200
    assert login.json()["user"]["uid"] == "uid-123"

    google = client.post("/api/auth/google", json={"idToken": "abc"})
    assert google.status_code == 200
    assert google.json()["user"]["email"] == "user@example.com"

    verify = client.post("/api/auth/verify-token")
    assert verify.status_code == 200
    assert verify.json()["user"]["uid"] == "uid-123"

    me = client.get("/api/auth/me")
    assert me.status_code == 200
    assert me.json()["uid"] == "uid-123"

    check_free = client.get("/api/auth/username/check", params={"username": "freeuser"})
    assert check_free.status_code == 200
    assert check_free.json()["available"] is True

    update = client.put("/api/auth/username", json={"username": "freeuser", "displayName": "Rowdy"})
    assert update.status_code == 200
    assert update.json()["success"] is True

    conflict = client.put("/api/auth/username", json={"username": "taken", "displayName": "Rowdy"})
    assert conflict.status_code == 409

    logout = client.post("/api/auth/logout")
    assert logout.status_code == 200
    assert logout.json()["success"] is True


def test_favorites_endpoints(client: TestClient):
    favs = client.get("/api/favorites")
    assert favs.status_code == 200
    assert isinstance(favs.json()["favoriteIds"], list)

    fav_products = client.get("/api/favorites/products")
    assert fav_products.status_code == 200
    assert isinstance(fav_products.json()["products"], list)

    added = client.post("/api/favorites/IMTIAZ_milk_1kg")
    assert added.status_code == 200
    assert added.json()["added"] is True

    removed = client.post("/api/favorites/IMTIAZ_milk_1kg")
    assert removed.status_code == 200
    assert removed.json()["added"] is False

    cleared = client.delete("/api/favorites")
    assert cleared.status_code == 200
    assert "cleared" in cleared.json()


def test_analytics_endpoints_authenticated(client: TestClient):
    purchase = client.post("/api/analytics/purchase", json={"productId": "ALFATAH_milk_1kg"})
    assert purchase.status_code == 200
    assert purchase.json()["success"] is True

    report = client.post(
        "/api/analytics/report",
        json={"productId": "ALFATAH_milk_1kg", "reason": "price_lower"},
    )
    assert report.status_code == 200
    assert report.json()["success"] is True

    action = client.post(
        "/api/analytics/action",
        json={"action": "view_product", "data": {"productId": "ALFATAH_milk_1kg"}},
    )
    assert action.status_code == 200
    assert action.json()["success"] is True


def test_analytics_purchase_guest_mode(client: TestClient):
    app = main_mod.app
    app.dependency_overrides[deps.get_optional_user] = lambda: None

    purchase = client.post("/api/analytics/purchase", json={"productId": "ALFATAH_milk_1kg"})
    assert purchase.status_code == 200
    assert purchase.json()["success"] is True
