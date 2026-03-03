# Qemat Web App Frontend

Next.js 14 frontend implementation based on `WEB_APP_PROMPT.md` from the Flutter app workspace.

## Stack
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Lucide icons

## Run

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set `NEXT_PUBLIC_API_BASE_URL` in `.env.local` if your backend is not running at `http://localhost:8000`.

## Backend Integration
- Product listing/search/trending data is fetched from the Python backend (`/api/products` with pagination + `/api/products/search`).
- Sign-in/sign-up uses backend auth (`/api/auth/login`, `/api/auth/register`).
- Favorites are synced through backend favorites APIs (`/api/favorites`).

## Validation Commands
```bash
npm run lint
npm run typecheck
npm run build
```

## Key Features Implemented
- Platform-aware theme system (material vs glass)
- Mobile bottom nav + desktop sidebar
- All requested primary routes/screens
- Shared reusable UI components
- Backend API integration for products/auth/favorites (with mock-data fallback for product loading)
- Auth-gated UX flows for favorites and assistant
