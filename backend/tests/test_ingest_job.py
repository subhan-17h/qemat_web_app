from __future__ import annotations

import asyncio
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from app.jobs import ingest


def metadata(**overrides):
    result = {
        "version": "v2",
        "fileUrl": "https://example.test/bundle.json",
        "productCount": 2,
        "lastUpdated": "2026-06-28T00:00:00Z",
    }
    result.update(overrides)
    return result


def configure_changed_bundle(monkeypatch, *, meta=None, products=None):
    monkeypatch.setattr(ingest.product_service, "fetch_bundle_metadata", AsyncMock(return_value=meta or metadata()))
    monkeypatch.setattr(ingest.product_db_service, "get_bundle_version", AsyncMock(return_value={"version": "v1"}))
    monkeypatch.setattr(ingest.product_service, "fetch_bundle", AsyncMock(return_value={"products": []}))
    monkeypatch.setattr(
        ingest.product_service,
        "parse_bundle_products",
        lambda *_args, **_kwargs: products if products is not None else [SimpleNamespace(), SimpleNamespace()],
    )
    upsert = AsyncMock()
    set_version = AsyncMock()
    monkeypatch.setattr(ingest.product_db_service, "upsert_products", upsert)
    monkeypatch.setattr(ingest.product_db_service, "set_bundle_version", set_version)
    return upsert, set_version


def test_unchanged_version_skips_bundle_and_database(monkeypatch):
    fetch_bundle = AsyncMock()
    upsert = AsyncMock()
    monkeypatch.setattr(ingest.product_service, "fetch_bundle_metadata", AsyncMock(return_value=metadata()))
    monkeypatch.setattr(ingest.product_db_service, "get_bundle_version", AsyncMock(return_value={"version": "v2"}))
    monkeypatch.setattr(ingest.product_service, "fetch_bundle", fetch_bundle)
    monkeypatch.setattr(ingest.product_db_service, "upsert_products", upsert)

    asyncio.run(ingest.ingest_bundle("grocery"))

    fetch_bundle.assert_not_awaited()
    upsert.assert_not_awaited()


def test_changed_bundle_is_upserted_then_versioned(monkeypatch):
    upsert, set_version = configure_changed_bundle(monkeypatch)
    asyncio.run(ingest.ingest_bundle("grocery"))
    upsert.assert_awaited_once()
    set_version.assert_awaited_once()


@pytest.mark.parametrize(
    "bad_metadata, expected",
    [
        (metadata(version=""), "Missing version"),
        (metadata(fileUrl=""), "Missing fileUrl"),
        (metadata(productCount=0), "Invalid grocery metadata productCount"),
        (metadata(productCount="bad"), "Invalid grocery metadata productCount"),
    ],
)
def test_invalid_metadata_is_rejected(monkeypatch, bad_metadata, expected):
    monkeypatch.setattr(ingest.product_service, "fetch_bundle_metadata", AsyncMock(return_value=bad_metadata))
    with pytest.raises(ValueError, match=expected):
        asyncio.run(ingest.ingest_bundle("grocery"))


def test_empty_bundle_is_rejected(monkeypatch):
    upsert, _ = configure_changed_bundle(monkeypatch, products=[])
    with pytest.raises(ValueError, match="empty grocery bundle"):
        asyncio.run(ingest.ingest_bundle("grocery"))
    upsert.assert_not_awaited()


def test_count_mismatch_is_rejected(monkeypatch):
    upsert, _ = configure_changed_bundle(monkeypatch, products=[SimpleNamespace()])
    with pytest.raises(ValueError, match="count mismatch"):
        asyncio.run(ingest.ingest_bundle("grocery"))
    upsert.assert_not_awaited()


def test_pool_is_closed_when_ingest_fails(monkeypatch):
    init_db = AsyncMock()
    close_pool = AsyncMock()
    monkeypatch.setattr(ingest, "init_db", init_db)
    monkeypatch.setattr(ingest, "close_pool", close_pool)
    monkeypatch.setattr(ingest, "ingest_bundle", AsyncMock(side_effect=RuntimeError("network")))
    with pytest.raises(RuntimeError, match="network"):
        asyncio.run(ingest.run_ingest("grocery"))
    init_db.assert_awaited_once()
    close_pool.assert_awaited_once()
