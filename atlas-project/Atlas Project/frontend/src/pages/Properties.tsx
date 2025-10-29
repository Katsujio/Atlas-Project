import { ChangeEvent, FormEvent, useMemo, useState } from "react";

import { usePortfolios, useProperties } from "../api/hooks";
import { PropertyPayload } from "../api/types";

const defaultFormState = {
  portfolio_id: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  purchase_price: "",
  monthly_rent: "",
  monthly_operating_expenses: "",
  monthly_mortgage: "",
};

const PropertiesPage = () => {
  const { listQuery: portfolioQuery } = usePortfolios();
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>("all");
  const portfolios = portfolioQuery.data?.items ?? [];
  const firstPortfolioId = portfolios[0]?.id?.toString() ?? "";

  const { listQuery, createMutation, deleteMutation, refreshRentCastMutation, previewRentCast } = useProperties(
    selectedPortfolioId === "all" ? undefined : Number(selectedPortfolioId),
  );

  const [formState, setFormState] = useState(defaultFormState);
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const derivedPortfolioId = useMemo(() => {
    if (formState.portfolio_id) return formState.portfolio_id;
    return firstPortfolioId;
  }, [formState.portfolio_id, firstPortfolioId]);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!derivedPortfolioId) {
      setError("Select a portfolio before adding a property.");
      return;
    }
    setError(null);
    const payload: PropertyPayload = {
      portfolio_id: Number(derivedPortfolioId),
      address: formState.address,
      city: formState.city,
      state: formState.state,
      zip: formState.zip,
      purchase_price: Number(formState.purchase_price || 0),
      monthly_rent: Number(formState.monthly_rent || 0),
      monthly_operating_expenses: Number(formState.monthly_operating_expenses || 0),
      monthly_mortgage: Number(formState.monthly_mortgage || 0),
    };
    createMutation.mutate(payload, {
      onSuccess: () => {
        setFormState(defaultFormState);
        setPreviewData(null);
      },
      onError: () => setError("Unable to create property"),
    });
  };

  const handlePreview = async () => {
    if (!formState.address) {
      setError("Enter an address to preview rent data");
      return;
    }
    setError(null);
    setIsPreviewLoading(true);
    try {
      const address = `${formState.address}, ${formState.city}, ${formState.state} ${formState.zip}`;
      const data = await previewRentCast(address);
      setPreviewData(data);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Unable to fetch RentCast preview");
    } finally {
      setIsPreviewLoading(false);
    }
  };

  if (!portfolioQuery.isLoading && portfolios.length === 0) {
    return (
      <div className="card" style={{ marginTop: "2rem" }}>
        <h2>Add a portfolio first</h2>
        <p style={{ color: "#6b7280" }}>
          Create at least one portfolio before adding properties so we know where to track them.
        </p>
      </div>
    );
  }

  return (
    <div className="form-grid" style={{ gap: "1.5rem" }}>
      <div className="card" style={{ display: "grid", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <h2 style={{ margin: 0, flex: 1 }}>Properties</h2>
          <select value={selectedPortfolioId} onChange={(event) => setSelectedPortfolioId(event.target.value)}>
            <option value="all">All portfolios</option>
            {portfolios.map((portfolio) => (
              <option key={portfolio.id} value={portfolio.id}>
                {portfolio.name}
              </option>
            ))}
          </select>
        </div>
        <p style={{ color: "#6b7280" }}>
          Track rental income, expenses, and valuations. Use RentCast to enrich the data before saving.
        </p>
        <form className="form-grid" onSubmit={handleSubmit} style={{ gap: "1rem" }}>
          <div className="form-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
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
              <label htmlFor="address">Address</label>
              <input id="address" name="address" value={formState.address} onChange={handleInputChange} required />
            </div>
            <div className="input-group">
              <label htmlFor="city">City</label>
              <input id="city" name="city" value={formState.city} onChange={handleInputChange} required />
            </div>
            <div className="input-group">
              <label htmlFor="state">State</label>
              <input id="state" name="state" value={formState.state} onChange={handleInputChange} required />
            </div>
            <div className="input-group">
              <label htmlFor="zip">ZIP</label>
              <input id="zip" name="zip" value={formState.zip} onChange={handleInputChange} required />
            </div>
          </div>

          <div className="form-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem" }}>
            <div className="input-group">
              <label htmlFor="purchase_price">Purchase price</label>
              <input
                id="purchase_price"
                name="purchase_price"
                type="number"
                min={0}
                value={formState.purchase_price}
                onChange={handleInputChange}
              />
            </div>
            <div className="input-group">
              <label htmlFor="monthly_rent">Monthly rent</label>
              <input
                id="monthly_rent"
                name="monthly_rent"
                type="number"
                min={0}
                value={formState.monthly_rent}
                onChange={handleInputChange}
              />
            </div>
            <div className="input-group">
              <label htmlFor="monthly_operating_expenses">Monthly expenses</label>
              <input
                id="monthly_operating_expenses"
                name="monthly_operating_expenses"
                type="number"
                min={0}
                value={formState.monthly_operating_expenses}
                onChange={handleInputChange}
              />
            </div>
            <div className="input-group">
              <label htmlFor="monthly_mortgage">Monthly mortgage</label>
              <input
                id="monthly_mortgage"
                name="monthly_mortgage"
                type="number"
                min={0}
                value={formState.monthly_mortgage}
                onChange={handleInputChange}
              />
            </div>
          </div>
          {error && <span style={{ color: "#ef4444" }}>{error}</span>}
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <button className="btn btn-secondary" type="button" onClick={handlePreview} disabled={isPreviewLoading}>
              {isPreviewLoading ? "Checking..." : "RentCast preview"}
            </button>
            <button className="btn btn-primary" type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Saving..." : "Add property"}
            </button>
          </div>
        </form>
        {previewData && (
          <div className="card" style={{ background: "#f1f5f9" }}>
            <h4 style={{ marginTop: 0 }}>RentCast snapshot</h4>
            <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.85rem" }}>
              {JSON.stringify(previewData.estimate, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Tracked properties</h3>
        {listQuery.isLoading ? (
          <p>Loading properties...</p>
        ) : (listQuery.data?.items?.length ?? 0) === 0 ? (
          <p style={{ color: "#6b7280" }}>Add a property to see it listed here.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Address</th>
                <th>Portfolio</th>
                <th>Rent</th>
                <th>Valuation</th>
                <th style={{ width: 200 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {listQuery.data?.items?.map((property) => (
                <tr key={property.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{property.address}</div>
                    <div style={{ color: "#6b7280", fontSize: "0.85rem" }}>
                      {property.city}, {property.state} {property.zip}
                    </div>
                  </td>
                  <td>{portfolios.find((item) => item.id === property.portfolio_id)?.name ?? ""}</td>
                  <td>${Math.round(property.monthly_rent ?? 0)}</td>
                  <td>${Math.round(property.last_valuation ?? 0)}</td>
                  <td>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        className="btn btn-secondary"
                        type="button"
                        onClick={() => refreshRentCastMutation.mutate(property.id)}
                        disabled={refreshRentCastMutation.isPending}
                      >
                        Refresh RentCast
                      </button>
                      <button
                        className="btn"
                        style={{ background: "#fee2e2", color: "#b91c1c" }}
                        type="button"
                        onClick={() => deleteMutation.mutate(property.id)}
                        disabled={deleteMutation.isPending}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default PropertiesPage;
