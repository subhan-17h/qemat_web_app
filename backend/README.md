# Qeemat Backend API

Python backend for the Qeemat price comparison web app, built with **FastAPI** and **Firebase Admin SDK**.

## Quick Start

```bash
# 1. Create virtual environment (Python 3.10+)
python3.10 -m venv venv
source venv/bin/activate  # macOS/Linux

# 2. Install dependencies
pip install -r requirements.txt

# 3. Add Firebase service account
# Download from Firebase Console → Project Settings → Service Accounts
# Save as service-account.json in this directory

# 4. Configure environment
cp .env.example .env
# Edit .env with your settings
# Set FIREBASE_WEB_API_KEY if you want server-side email/password login
# Set DATABASE_URL for PostgreSQL (e.g. postgresql://user:pass@localhost:5432/qemat)

# 5. Run the server
source venv/bin/activate
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

## Bundle Ingestion (PostgreSQL)
Run the ingestion job to load the latest bundle into Postgres:

```bash
python -m app.jobs.ingest
```

Cron (weekly) example:
```bash
0 2 * * 0 cd /path/to/backend && /path/to/venv/bin/python -m app.jobs.ingest >> /var/log/qemat-ingest.log 2>&1
```

## API Docs

Once running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/products/metadata` | No | Bundle metadata |
| GET | `/api/products/bundle?type=grocery|pharma` | No | Full product bundle |
| GET | `/api/products/search?q=&type=grocery|pharma` | No | Search products |
| GET | `/api/products/trending` | No | Trending products |
| GET | `/api/products` | No | List products |
| GET | `/api/products/{id}` | No | Single product |
| GET | `/api/products/{id}/matches` | No | Product + matches |
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/verify-token` | Yes | Verify Firebase token |
| GET | `/api/auth/me` | Yes | Current user profile |
| GET | `/api/auth/username/check` | No | Check username |
| PUT | `/api/auth/username` | Yes | Update username |
| GET | `/api/favorites` | Yes | User's favorites |
| POST | `/api/favorites/{id}` | Yes | Toggle favorite |
| POST | `/api/analytics/purchase` | Optional | Track purchase |
| POST | `/api/analytics/report` | Optional | Report price issue |
