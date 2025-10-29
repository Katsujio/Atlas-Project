export type AuthTokens = {
  access_token: string;
  refresh_token: string;
  token_type: string;
};

export type AuthResponse = {
  user: {
    id: number;
    email: string;
    created_at: string;
  };
  tokens: AuthTokens;
};

export type Portfolio = {
  id: number;
  name: string;
};

export type PortfolioPayload = {
  name: string;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  page_size: number;
};

export type Property = {
  id: number;
  portfolio_id: number;
  address: string;
  city: string;
  state: string;
  zip: string;
  purchase_price: number;
  purchase_date: string | null;
  valuation_method: string;
  last_valuation: number;
  last_valuation_at: string | null;
  monthly_rent: number;
  monthly_operating_expenses: number;
  monthly_mortgage: number;
  mortgage_balance: number;
  bedrooms: number;
  bathrooms: number;
  living_area_sqft: number;
  year_built: number | null;
  rc_last_checked_at: string | null;
  rc_confidence: number;
  rc_source_id: string | null;
};

export type PropertyPayload = {
  portfolio_id: number;
  address: string;
  city: string;
  state: string;
  zip: string;
  purchase_price: number;
  purchase_date?: string | null;
  valuation_method?: string;
  last_valuation?: number;
  last_valuation_at?: string | null;
  monthly_rent?: number;
  monthly_operating_expenses?: number;
  monthly_mortgage?: number;
  mortgage_balance?: number;
  bedrooms?: number;
  bathrooms?: number;
  living_area_sqft?: number;
  year_built?: number | null;
};

export type StockHolding = {
  id: number;
  portfolio_id: number;
  symbol: string;
  shares: number;
  average_cost: number;
  last_price: number;
  last_price_at: string | null;
  notes: string | null;
};

export type StockPayload = {
  portfolio_id: number;
  symbol: string;
  shares: number;
  average_cost?: number;
  last_price?: number;
  last_price_at?: string | null;
  notes?: string | null;
};

export type DashboardSummary = {
  total_net_worth: number;
  liquid_cashflow_monthly: number;
  property_count: number;
  stock_count: number;
  allocation: {
    stocks_value: number;
    properties_value: number;
  };
  timeline: Array<{
    as_of: string;
    net_worth: number;
  }>;
};

export type RentCastPreview = {
  details: Record<string, unknown>;
  estimate: Record<string, unknown>;
  comps: Array<Record<string, unknown>>;
};
