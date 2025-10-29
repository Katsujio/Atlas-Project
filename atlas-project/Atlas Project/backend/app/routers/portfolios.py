from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app import schemas
from app.deps import get_current_user, get_db
from app.models import Portfolio, User

router = APIRouter(prefix="/portfolios", tags=["portfolios"])


def _get_portfolio_or_404(db: Session, portfolio_id: int, user_id: int) -> Portfolio:
    portfolio = db.get(Portfolio, portfolio_id)
    if not portfolio or portfolio.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio not found")
    return portfolio


@router.get("/", response_model=schemas.PortfolioList)
def list_portfolios(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> schemas.PortfolioList:
    total = db.scalar(
        select(func.count()).select_from(Portfolio).where(Portfolio.user_id == current_user.id)
    )
    stmt = (
        select(Portfolio)
        .where(Portfolio.user_id == current_user.id)
        .offset((page - 1) * page_size)
        .limit(page_size)
        .order_by(Portfolio.id.desc())
    )
    items = db.scalars(stmt).all()
    return schemas.PortfolioList(items=items, total=total or 0, page=page, page_size=page_size)


@router.post("/", response_model=schemas.PortfolioRead, status_code=status.HTTP_201_CREATED)
def create_portfolio(
    payload: schemas.PortfolioCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> Portfolio:
    portfolio = Portfolio(user_id=current_user.id, name=payload.name)
    db.add(portfolio)
    db.commit()
    db.refresh(portfolio)
    return portfolio


@router.get("/{portfolio_id}", response_model=schemas.PortfolioRead)
def get_portfolio(
    portfolio_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> Portfolio:
    return _get_portfolio_or_404(db, portfolio_id, current_user.id)


@router.put("/{portfolio_id}", response_model=schemas.PortfolioRead)
def update_portfolio(
    portfolio_id: int,
    payload: schemas.PortfolioUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> Portfolio:
    portfolio = _get_portfolio_or_404(db, portfolio_id, current_user.id)
    if payload.name is not None:
        portfolio.name = payload.name
    db.add(portfolio)
    db.commit()
    db.refresh(portfolio)
    return portfolio


@router.delete("/{portfolio_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_portfolio(
    portfolio_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> None:
    portfolio = _get_portfolio_or_404(db, portfolio_id, current_user.id)
    db.delete(portfolio)
    db.commit()
