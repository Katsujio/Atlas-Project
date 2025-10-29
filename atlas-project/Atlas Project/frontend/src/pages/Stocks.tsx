import { ChangeEvent, FormEvent, useMemo, useState } from "react";

import { usePortfolios, useStocks } from "../api/hooks";
import { StockPayload } from "../api/types";

const defaultStockForm = {
  portfolio_id: "",
  symbol: "",
  shares: "",
  average_cost: "",
  last_price: "",
};

const StocksPage = () => {
  const { listQuery: portfolioQuery } = usePortfolios();
  const portfolios = portfolioQuery.data?.items ?? [];
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>("all");
  const { listQuery, createMutation, deleteMutation } = useStocks(
    selectedPortfolioId === "all" ? undefined : Number(selectedPortfolioId),
  );
  const [formState, setFormState] = useState(defaultStockForm);

  const derivedPortfolioId = useMemo(() => {
    if (formState.portfolio_id) return formState.portfolio_id;
    return portfolios[0]?.id?.toString() ?? "";
  }, [formState.portfolio_id, portfolios]);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!derivedPortfolioId || !formState.symbol.trim()) return;
    const payload: StockPayload = {
      portfolio_id: Number(derivedPortfolioId),
      symbol: formState.symbol.toUpperCase(),
      shares: Number(formState.shares || 0),
      average_cost: Number(formState.average_cost || 0),
      last_price: Number(formState.last_price || 0),
    };
    createMutation.mutate(payload, {
      onSuccess: () => setFormState(defaultStockForm),
    });
  };

  const holdings = listQuery.data?.items ?? [];

  if (!portfolioQuery.isLoading && portfolios.length === 0) {
    return (
      <div className="card" style={{ marginTop: "2rem" }}>
        <h2>Add a portfolio first</h2>
        <p style={{ color: "#6b7280" }}>
          Create at least one portfolio before adding stock holdings.
        </p>
      </div>
    );
  }

  return (
    <div className="form-grid" style={{ gap: "1.5rem" }}>
      <div className="card" style={{ display: "grid", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <h2 style={{ margin: 0, flex: 1 }}>Stocks</h2>
          <select value={selectedPortfolioId} onChange={(event) => setSelectedPortfolioId(event.target.value)}>
            <option value="all">All portfolios</option>
            {portfolios.map((portfolio) => (
              <option key={portfolio.id} value={portfolio.id}>
                {portfolio.name}
              </option>
            ))}
          </select>
        </div>
        <form className="form-grid" onSubmit={handleSubmit} style={{ gap: "1rem" }}>
          <div className="form-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem" }}>
            <div className="input-group">
              <label htmlFor="portfolio_id">Portfolio</label>
              <select
                id="portfolio_id"
                name="portfolio_id"
                required
                value={derivedPortfolioId}
                onChange={handleInputChange}
              >
                <option value="">Select</option>
                {portfolios.map((portfolio) => (
                  <option key={portfolio.id} value={portfolio.id}>
                    {portfolio.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label htmlFor="symbol">Symbol</label>
              <input
                id="symbol"
                name="symbol"
                value={formState.symbol}
                onChange={handleInputChange}
                placeholder="e.g. AAPL"
                required
              />
            </div>
            <div className="input-group">
              <label htmlFor="shares">Shares</label>
              <input
                id="shares"
                name="shares"
                type="number"
                min={0}
                step="0.01"
                value={formState.shares}
                onChange={handleInputChange}
              />
            </div>
            <div className="input-group">
              <label htmlFor="average_cost">Avg cost</label>
              <input
                id="average_cost"
                name="average_cost"
                type="number"
                min={0}
                step="0.01"
                value={formState.average_cost}
                onChange={handleInputChange}
              />
            </div>
            <div className="input-group">
              <label htmlFor="last_price">Last price</label>
              <input
                id="last_price"
                name="last_price"
                type="number"
                min={0}
                step="0.01"
                value={formState.last_price}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <button className="btn btn-primary" type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Saving..." : "Add holding"}
          </button>
        </form>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Holdings</h3>
        {listQuery.isLoading ? (
          <p>Loading holdings...</p>
        ) : holdings.length === 0 ? (
          <p style={{ color: "#6b7280" }}>Add your first holding to see it here.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Portfolio</th>
                <th>Shares</th>
                <th>Avg Cost</th>
                <th>Last Price</th>
                <th>Value</th>
                <th style={{ width: 150 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((holding) => {
                const portfolioName =
                  portfolios.find((portfolio) => portfolio.id === holding.portfolio_id)?.name ?? "";
                const marketValue = holding.shares * holding.last_price;
                return (
                  <tr key={holding.id}>
                    <td style={{ fontWeight: 600 }}>{holding.symbol}</td>
                    <td>{portfolioName}</td>
                    <td>{holding.shares.toFixed(2)}</td>
                    <td>${holding.average_cost.toFixed(2)}</td>
                    <td>${holding.last_price.toFixed(2)}</td>
                    <td>${marketValue.toFixed(2)}</td>
                    <td>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          className="btn"
                          style={{ background: "#fee2e2", color: "#b91c1c" }}
                          type="button"
                          onClick={() => deleteMutation.mutate(holding.id)}
                          disabled={deleteMutation.isPending}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default StocksPage;
