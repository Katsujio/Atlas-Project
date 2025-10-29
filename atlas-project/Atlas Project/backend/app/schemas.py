
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class RentCastPreview(BaseModel):
    details: dict
    estimate: dict
    comps: list


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserLogin(UserBase):
    password: str = Field(min_length=1)


class UserRead(UserBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True


class AuthResponse(BaseModel):
    user: UserRead
    tokens: TokenPair


class TokenRefreshRequest(BaseModel):
    refresh_token: str


class PortfolioBase(BaseModel):
    name: str = Field(default="My Portfolio", max_length=120)


class PortfolioCreate(PortfolioBase):
    pass


class PortfolioUpdate(BaseModel):
    name: Optional[str] = Field(default=None, max_length=120)


class PortfolioRead(PortfolioBase):
    id: int

    class Config:
        orm_mode = True


class PortfolioList(BaseModel):
    items: list[PortfolioRead]
    total: int
    page: int
    page_size: int


class PropertyBase(BaseModel):
    address: str = Field(max_length=255)
    city: str = Field(max_length=120)
    state: str = Field(max_length=8)
    zip: str = Field(max_length=16)
    purchase_price: float = 0.0
    purchase_date: Optional[date] = None
    valuation_method: str = "manual"
    last_valuation: float = 0.0
    last_valuation_at: Optional[datetime] = None
    monthly_rent: float = 0.0
    monthly_operating_expenses: float = 0.0
    monthly_mortgage: float = 0.0
    mortgage_balance: float = 0.0
    bedrooms: float = 0.0
    bathrooms: float = 0.0
    living_area_sqft: float = 0.0
    year_built: Optional[int] = None
    rc_last_checked_at: Optional[datetime] = None
    rc_confidence: float = 0.0
    rc_source_id: Optional[str] = None


class PropertyCreate(PropertyBase):
    portfolio_id: int


class PropertyUpdate(BaseModel):
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip: Optional[str] = None
    purchase_price: Optional[float] = None
    purchase_date: Optional[date] = None
    valuation_method: Optional[str] = None
    last_valuation: Optional[float] = None
    last_valuation_at: Optional[datetime] = None
    monthly_rent: Optional[float] = None
    monthly_operating_expenses: Optional[float] = None
    monthly_mortgage: Optional[float] = None
    mortgage_balance: Optional[float] = None
    bedrooms: Optional[float] = None
    bathrooms: Optional[float] = None
    living_area_sqft: Optional[float] = None
    year_built: Optional[int] = None
    rc_last_checked_at: Optional[datetime] = None
    rc_confidence: Optional[float] = None
    rc_source_id: Optional[str] = None


class PropertyRead(PropertyBase):
    id: int
    portfolio_id: int

    class Config:
        orm_mode = True


class PropertyList(BaseModel):
    items: list[PropertyRead]
    total: int
    page: int
    page_size: int


class StockBase(BaseModel):
    portfolio_id: int
    symbol: str = Field(max_length=16)
    shares: float = 0.0
    average_cost: float = 0.0
    last_price: float = 0.0
    last_price_at: Optional[datetime] = None
    notes: Optional[str] = Field(default=None, max_length=255)


class StockCreate(StockBase):
    pass


class StockUpdate(BaseModel):
    symbol: Optional[str] = None
    shares: Optional[float] = None
    average_cost: Optional[float] = None
    last_price: Optional[float] = None
    last_price_at: Optional[datetime] = None
    notes: Optional[str] = Field(default=None, max_length=255)


class StockRead(StockBase):
    id: int

    class Config:
        orm_mode = True


class StockList(BaseModel):
    items: list[StockRead]
    total: int
    page: int
    page_size: int


class DashboardAllocation(BaseModel):
    stocks_value: float
    properties_value: float


class DashboardTimelinePoint(BaseModel):
    as_of: datetime
    net_worth: float


class DashboardSummary(BaseModel):
    total_net_worth: float
    liquid_cashflow_monthly: float
    property_count: int
    stock_count: int
    allocation: DashboardAllocation
    timeline: list[DashboardTimelinePoint]
