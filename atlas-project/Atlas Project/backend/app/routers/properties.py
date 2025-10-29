from datetime import datetime
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app import schemas
from app.deps import get_current_user, get_db
from app.models import Portfolio, Property, RentComp, RentEstimate, User
from app.providers.rentcast import RentCastProvider

router = APIRouter(prefix="/properties", tags=["properties"])


def _ensure_portfolio(db: Session, portfolio_id: int, user_id: int) -> Portfolio:
    portfolio = db.get(Portfolio, portfolio_id)
    if not portfolio or portfolio.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio not found")
    return portfolio


def _get_property_or_404(db: Session, property_id: int, user_id: int) -> Property:
    property_obj = db.get(Property, property_id)
    if not property_obj or property_obj.portfolio.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    return property_obj


@router.get("/", response_model=schemas.PropertyList)
def list_properties(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    portfolio_id: Optional[int] = Query(default=None),
) -> schemas.PropertyList:
    base_filter = Property.portfolio.has(Portfolio.user_id == current_user.id)
    filters = [base_filter]
    if portfolio_id is not None:
        filters.append(Property.portfolio_id == portfolio_id)

    total_stmt = select(func.count()).select_from(Property).where(*filters)
    total = db.scalar(total_stmt) or 0

    stmt = (
        select(Property)
        .where(*filters)
        .offset((page - 1) * page_size)
        .limit(page_size)
        .order_by(Property.id.desc())
    )
    items = db.scalars(stmt).all()
    return schemas.PropertyList(items=items, total=total, page=page, page_size=page_size)


@router.post("/", response_model=schemas.PropertyRead, status_code=status.HTTP_201_CREATED)
def create_property(
    payload: schemas.PropertyCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> Property:
    _ensure_portfolio(db, payload.portfolio_id, current_user.id)
    property_obj = Property(**payload.dict())
    db.add(property_obj)
    db.commit()
    db.refresh(property_obj)
    return property_obj


@router.get("/{property_id}", response_model=schemas.PropertyRead)
def get_property(
    property_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> Property:
    return _get_property_or_404(db, property_id, current_user.id)


@router.put("/{property_id}", response_model=schemas.PropertyRead)
def update_property(
    property_id: int,
    payload: schemas.PropertyUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> Property:
    property_obj = _get_property_or_404(db, property_id, current_user.id)
    update_data = payload.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(property_obj, field, value)
    db.add(property_obj)
    db.commit()
    db.refresh(property_obj)
    return property_obj


@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_property(
    property_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> None:
    property_obj = _get_property_or_404(db, property_id, current_user.id)
    db.delete(property_obj)
    db.commit()


@router.post("/{property_id}/refresh-rentcast", response_model=schemas.PropertyRead)
def refresh_property_rentcast(
    property_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> Property:
    property_obj = _get_property_or_404(db, property_id, current_user.id)
    provider = RentCastProvider()
    address = f"{property_obj.address}, {property_obj.city}, {property_obj.state} {property_obj.zip}"

    try:
        details = provider.get_property_details(address)
        estimate = provider.get_rent_estimate(address)
        comps = provider.get_rent_comps(address, limit=8)
    except Exception as exc:  # pragma: no cover - upstream errors
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"RentCast error: {exc}") from exc

    if details:
        if details.get("bedrooms") is not None:
            property_obj.bedrooms = float(details.get("bedrooms"))
        if details.get("bathrooms") is not None:
            property_obj.bathrooms = float(details.get("bathrooms"))
        sqft = details.get("squareFootage") or details.get("livingAreaSqFt")
        if sqft is not None:
            property_obj.living_area_sqft = float(sqft)
        if details.get("yearBuilt"):
            property_obj.year_built = int(details.get("yearBuilt"))
        if details.get("id"):
            property_obj.rc_source_id = str(details.get("id"))

    if estimate:
        if estimate.get("confidenceScore") is not None:
            property_obj.rc_confidence = float(estimate.get("confidenceScore"))
    property_obj.rc_last_checked_at = datetime.utcnow()

    if estimate:
        rent_estimate = RentEstimate(
            property_id=property_obj.id,
            estimate=float(estimate.get("rent") or 0),
            low=float(estimate.get("lowRent") or 0),
            high=float(estimate.get("highRent") or 0),
        )
        property_obj.monthly_rent = rent_estimate.estimate
        valuation_value = details.get("estimatedValue") if details else None
        if valuation_value is not None:
            property_obj.last_valuation = float(valuation_value)
            property_obj.last_valuation_at = datetime.utcnow()
        db.add(rent_estimate)

    # clear existing comps
    db.execute(delete(RentComp).where(RentComp.property_id == property_obj.id))
    for comp in comps or []:
        db.add(
            RentComp(
                property_id=property_obj.id,
                address=comp.get("address", ""),
                distance_mi=float(comp.get("distance", 0)),
                monthly_rent=float(comp.get("rent", 0)),
                bed=float(comp.get("bedrooms", 0)),
                bath=float(comp.get("bathrooms", 0)),
                sqft=float(comp.get("squareFootage", 0)),
                days_on_market=int(comp.get("daysOnMarket", 0)),
            )
        )

    db.add(property_obj)
    db.commit()
    db.refresh(property_obj)
    return property_obj
