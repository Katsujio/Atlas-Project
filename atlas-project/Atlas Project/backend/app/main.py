
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import (
    auth as auth_router,
    dashboard as dashboard_router,
    portfolios as portfolios_router,
    properties as properties_router,
    rentcast as rentcast_router,
    stocks as stocks_router,
)
from app.db import engine
from app.models import Base

app = FastAPI(title="Cross-Asset Portfolio API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(",")],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

# Create tables automatically for dev (use Alembic for prod)
Base.metadata.create_all(bind=engine)

@app.get("/health")
def health(): return {"status":"ok"}

# Routers
app.include_router(auth_router.router)
app.include_router(portfolios_router.router)
app.include_router(properties_router.router)
app.include_router(stocks_router.router)
app.include_router(dashboard_router.router)
app.include_router(rentcast_router.router)
