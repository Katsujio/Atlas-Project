from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app import schemas
from app.deps import get_current_user, get_db
from app.models import Portfolio, StockHolding, User

router = APIRouter(prefix="/stocks", tags=["stocks"])


def _ensure_portfolio(db: Session, portfolio_id: int, user_id: int) -> Portfolio:
    portfolio = db.get(Portfolio, portfolio_id)
    if not portfolio or portfolio.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio not found")
    return portfolio


def _get_stock_or_404(db: Session, stock_id: int, user_id: int) -> StockHolding:
    holding = db.get(StockHolding, stock_id)
    if not holding or holding.portfolio.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stock not found")
    return holding


@router.get("/", response_model=schemas.StockList)
def list_stocks(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    portfolio_id: Optional[int] = Query(default=None),
) -> schemas.StockList:
    filters = [StockHolding.portfolio.has(Portfolio.user_id == current_user.id)]
    if portfolio_id is not None:
        filters.append(StockHolding.portfolio_id == portfolio_id)

    total_stmt = select(func.count()).select_from(StockHolding).where(*filters)
    total = db.scalar(total_stmt) or 0

    stmt = (
        select(StockHolding)
        .where(*filters)
        .offset((page - 1) * page_size)
        .limit(page_size)
        .order_by(StockHolding.id.desc())
    )
    items = db.scalars(stmt).all()
    return schemas.StockList(items=items, total=total, page=page, page_size=page_size)


@router.post("/", response_model=schemas.StockRead, status_code=status.HTTP_201_CREATED)
def create_stock(
    payload: schemas.StockCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> StockHolding:
    _ensure_portfolio(db, payload.portfolio_id, current_user.id)
    holding = StockHolding(**payload.dict())
    db.add(holding)
    db.commit()
    db.refresh(holding)
    return holding


@router.get("/{stock_id}", response_model=schemas.StockRead)
def get_stock(
    stock_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> StockHolding:
    return _get_stock_or_404(db, stock_id, current_user.id)


@router.put("/{stock_id}", response_model=schemas.StockRead)
def update_stock(
    stock_id: int,
    payload: schemas.StockUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> StockHolding:
    holding = _get_stock_or_404(db, stock_id, current_user.id)
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(holding, field, value)
    db.add(holding)
    db.commit()
    db.refresh(holding)
    return holding


@router.delete("/{stock_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_stock(
    stock_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> None:
    holding = _get_stock_or_404(db, stock_id, current_user.id)
    db.delete(holding)
    db.commit()
