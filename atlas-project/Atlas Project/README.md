# Cross-Asset Portfolio Workspace (Stocks + Real Estate)

Minimal end-to-end MVP for tracking properties and equities across multiple portfolios.
The backend is built with **FastAPI + SQLAlchemy 2.x**, the frontend with **React + Vite + TypeScript**,
and rental valuations are enriched via **RentCast** (server side only).

---

## Prerequisites

- Python 3.11+
- Node.js 18+
- RentCast API key (server side)

---

## Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # fill in JWT_SECRET and RENTCAST_API_KEY
uvicorn app.main:app --reload --port 8000
```

Key environment variables (see `.env.example`):

- `DATABASE_URL` (defaults to SQLite `dev.db`)
- `JWT_SECRET`, `JWT_ACCESS_EXPIRES`, `JWT_REFRESH_EXPIRES`
- `CORS_ORIGINS` (defaults to `http://localhost:5173`)
- `RENTCAST_API_KEY` and `RENTCAST_BASE_URL`

---

## Frontend Setup

```bash
cd frontend
npm install
# optional: set VITE_API_BASE_URL if backend runs on a different URL
npm run dev
```

The Vite dev server proxies `/api/*` to the backend. For production builds run `npm run build`
and serve the contents of `dist/` behind the FastAPI app or a static host.

---

## Feature Overview

- **Auth** – email + password registration, bcrypt hashing, JWT access/refresh pair.
- **Portfolios** – CRUD with ownership scoping and pagination-ready responses.
- **Properties** – CRUD, income/expense tracking, RentCast preview + refresh endpoint, stored comps/estimates.
- **Stocks** – CRUD for equity holdings with valuation fields.
- **Dashboard** – aggregate net worth, allocation split, cash-flow summary, mini trend line.
- **Frontend** – React Router pages, React Query data fetching/mutations, axios client with token refresh, Recharts dashboard, RentCast lookup button in property form.

Backoffice routes are authenticated; the RentCast provider never exposes API keys to the browser.

---

## API Reference (selected)

| Method | Path | Description |
| ------ | ---- | ----------- |
| POST | `/auth/register` | Create account and return tokens |
| POST | `/auth/login` | Issue access + refresh tokens |
| POST | `/auth/refresh` | Rotate tokens using refresh token |
| GET | `/auth/me` | Current user profile |
| CRUD | `/portfolios` | Manage portfolios |
| CRUD | `/properties` | Manage properties, `/properties/{id}/refresh-rentcast` to sync data |
| CRUD | `/stocks` | Manage stock holdings |
| GET | `/dashboard` | Summary aggregates |
| GET | `/integrations/rentcast/preview` | Fetch RentCast preview for an address |

All list endpoints support simple pagination (`page`, `page_size`).

---

## Project Structure

```
backend/
  app/
    core/
    deps.py
    main.py
    models/
    providers/
    routers/
    schemas.py
  .env.example
  requirements.txt
frontend/
  src/
    api/
    components/
    context/
    hooks/
    pages/
    styles/
  package.json
  vite.config.ts
scripts/
```

---

## Notes

- RentCast integration retries on 429 and enforces all lookups from the backend.
- Dashboard timeline is a simple trailing trend that can be swapped for historical data later.
- Extend the schema or add analytics by building on the existing SQLAlchemy models.
