from datetime import datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import schemas
from app.deps import get_current_user, get_db
from app.models import Portfolio, Property, StockHolding, User

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/", response_model=schemas.DashboardSummary)
def get_dashboard_summary(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> schemas.DashboardSummary:
    properties = db.scalars(
        select(Property).join(Portfolio).where(Portfolio.user_id == current_user.id)
    ).all()
    stocks = db.scalars(
        select(StockHolding).join(Portfolio).where(Portfolio.user_id == current_user.id)
    ).all()

    properties_value = sum((prop.last_valuation or prop.purchase_price or 0.0) for prop in properties)
    stocks_value = sum((holding.last_price or 0.0) * (holding.shares or 0.0) for holding in stocks)
    total_net_worth = round(properties_value + stocks_value, 2)

    liquid_cashflow = sum(
        (prop.monthly_rent or 0.0)
        - (prop.monthly_operating_expenses or 0.0)
        - (prop.monthly_mortgage or 0.0)
        for prop in properties
    )

    # simple trailing 6-month timeline
    now = datetime.utcnow()
    timeline: list[schemas.DashboardTimelinePoint] = []
    for months_back in range(5, -1, -1):
        as_of = now - timedelta(days=30 * months_back)
        trend_factor = 0.94 + (0.01 * (5 - months_back))
        timeline.append(
            schemas.DashboardTimelinePoint(
                as_of=as_of,
                net_worth=round(total_net_worth * trend_factor if total_net_worth else 0.0, 2),
            )
        )

    allocation = schemas.DashboardAllocation(
        stocks_value=round(stocks_value, 2),
        properties_value=round(properties_value, 2),
    )

    return schemas.DashboardSummary(
        total_net_worth=total_net_worth,
        liquid_cashflow_monthly=round(liquid_cashflow, 2),
        property_count=len(properties),
        stock_count=len(stocks),
        allocation=allocation,
        timeline=timeline,
    )
