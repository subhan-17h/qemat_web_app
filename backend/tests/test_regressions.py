from __future__ import annotations

import app.services.product_service as product_service
from app.models.product import parse_product_from_raw


def test_price_parsing_handles_currency_and_commas():
    product = parse_product_from_raw(
        {
            "product_id": "A",
            "name": "Milk",
            "price": "Rs. 1,250",
            "store_id": "Al-Fatah",
            "category": "Milk",
        }
    )
    assert product.price == 1250.0


def test_bundle_parser_resolves_gs_image_urls(monkeypatch):
    class _Blob:
        def __init__(self, path: str):
            self.path = path

        def generate_signed_url(self, expiration):
            return f"https://signed.example/{self.path}"

    class _Bucket:
        def blob(self, path: str):
            return _Blob(path)

    monkeypatch.setattr(product_service, "get_storage_bucket", lambda: _Bucket())

    products = product_service._parse_bundle_products(
        {
            "products": [
                {
                    "product_id": "A",
                    "name": "Milk",
                    "price": 100,
                    "store_id": "Al-Fatah",
                    "category": "Milk",
                    "image_url": "gs://qemat-a2a2c.appspot.com/images/a.jpg",
                }
            ]
        }
    )

    assert products[0].image_url == "https://signed.example/images/a.jpg"
