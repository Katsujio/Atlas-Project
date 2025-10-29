
from typing import List, Optional

from sqlalchemy import String, Integer, Float, ForeignKey, Date, DateTime, func
from sqlalchemy.orm import Mapped, declarative_base, mapped_column, relationship

Base = declarative_base()

class User(Base):
    __tablename__="users"
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[DateTime] = mapped_column(server_default=func.now())
    portfolios: Mapped[List["Portfolio"]] = relationship(
        back_populates="owner", cascade="all, delete-orphan"
    )

class Portfolio(Base):
    __tablename__="portfolios"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(120), default="My Portfolio")
    owner: Mapped["User"] = relationship(back_populates="portfolios")
    properties: Mapped[List["Property"]] = relationship(
        back_populates="portfolio", cascade="all, delete-orphan"
    )
    stock_holdings: Mapped[List["StockHolding"]] = relationship(
        back_populates="portfolio", cascade="all, delete-orphan"
    )

class Property(Base):
    __tablename__="properties"
    id: Mapped[int] = mapped_column(primary_key=True)
    portfolio_id: Mapped[int] = mapped_column(ForeignKey("portfolios.id", ondelete="CASCADE"))
    address: Mapped[str] = mapped_column(String(255))
    city: Mapped[str] = mapped_column(String(120))
    state: Mapped[str] = mapped_column(String(8))
    zip: Mapped[str] = mapped_column(String(16))
    purchase_price: Mapped[float] = mapped_column(Float, default=0.0)
    purchase_date: Mapped[Date] = mapped_column(nullable=True)
    valuation_method: Mapped[str] = mapped_column(String(32), default="manual")
    last_valuation: Mapped[float] = mapped_column(Float, default=0.0)
    last_valuation_at: Mapped[DateTime] = mapped_column(nullable=True)
    monthly_rent: Mapped[float] = mapped_column(Float, default=0.0)
    monthly_operating_expenses: Mapped[float] = mapped_column(Float, default=0.0)
    monthly_mortgage: Mapped[float] = mapped_column(Float, default=0.0)
    mortgage_balance: Mapped[float] = mapped_column(Float, default=0.0)
    # RentCast enrichments
    bedrooms: Mapped[float] = mapped_column(Float, default=0.0)
    bathrooms: Mapped[float] = mapped_column(Float, default=0.0)
    living_area_sqft: Mapped[float] = mapped_column(Float, default=0.0)
    year_built: Mapped[int] = mapped_column(Integer, nullable=True)
    rc_last_checked_at: Mapped[DateTime] = mapped_column(nullable=True)
    rc_confidence: Mapped[float] = mapped_column(Float, default=0.0)
    rc_source_id: Mapped[str] = mapped_column(String(64), nullable=True)
    portfolio: Mapped["Portfolio"] = relationship(back_populates="properties")
    rent_estimates: Mapped[List["RentEstimate"]] = relationship(
        back_populates="property", cascade="all, delete-orphan"
    )
    rent_comps: Mapped[List["RentComp"]] = relationship(
        back_populates="property", cascade="all, delete-orphan"
    )

class RentEstimate(Base):
    __tablename__="rent_estimates"
    id: Mapped[int] = mapped_column(primary_key=True)
    property_id: Mapped[int] = mapped_column(ForeignKey("properties.id", ondelete="CASCADE"))
    estimate: Mapped[float] = mapped_column(Float)
    low: Mapped[float] = mapped_column(Float)
    high: Mapped[float] = mapped_column(Float)
    as_of: Mapped[DateTime] = mapped_column(server_default=func.now())
    provider: Mapped[str] = mapped_column(String(32), default="rentcast")
    property: Mapped["Property"] = relationship(back_populates="rent_estimates")

class RentComp(Base):
    __tablename__="rent_comps"
    id: Mapped[int] = mapped_column(primary_key=True)
    property_id: Mapped[int] = mapped_column(ForeignKey("properties.id", ondelete="CASCADE"))
    address: Mapped[str] = mapped_column(String(255))
    distance_mi: Mapped[float] = mapped_column(Float, default=0.0)
    monthly_rent: Mapped[float] = mapped_column(Float, default=0.0)
    bed: Mapped[float] = mapped_column(Float, default=0.0)
    bath: Mapped[float] = mapped_column(Float, default=0.0)
    sqft: Mapped[float] = mapped_column(Float, default=0.0)
    days_on_market: Mapped[int] = mapped_column(Integer, default=0)
    as_of: Mapped[DateTime] = mapped_column(server_default=func.now())
    provider: Mapped[str] = mapped_column(String(32), default="rentcast")
    property: Mapped["Property"] = relationship(back_populates="rent_comps")

class StockHolding(Base):
    __tablename__ = "stock_holdings"
    id: Mapped[int] = mapped_column(primary_key=True)
    portfolio_id: Mapped[int] = mapped_column(ForeignKey("portfolios.id", ondelete="CASCADE"))
    symbol: Mapped[str] = mapped_column(String(16))
    shares: Mapped[float] = mapped_column(Float, default=0.0)
    average_cost: Mapped[float] = mapped_column(Float, default=0.0)
    last_price: Mapped[float] = mapped_column(Float, default=0.0)
    last_price_at: Mapped[Optional[DateTime]] = mapped_column(nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    portfolio: Mapped["Portfolio"] = relationship(back_populates="stock_holdings")
