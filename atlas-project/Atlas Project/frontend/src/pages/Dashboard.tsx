import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useDashboard } from "../api/hooks";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value ?? 0);

const DashboardPage = () => {
  const { data, isLoading } = useDashboard();

  if (isLoading || !data) {
    return <div>Loading portfolio overview...</div>;
  }

  return (
    <div className="form-grid" style={{ gap: "1.5rem" }}>
      <div className="card" style={{ display: "grid", gap: "1rem" }}>
        <h2 style={{ margin: 0 }}>Portfolio snapshot</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem" }}>
          <div>
            <span style={{ color: "#6b7280", fontSize: "0.85rem" }}>Net worth</span>
            <h3 style={{ marginTop: "0.25rem" }}>{formatCurrency(data.total_net_worth)}</h3>
          </div>
          <div>
            <span style={{ color: "#6b7280", fontSize: "0.85rem" }}>Monthly cashflow</span>
            <h3 style={{ marginTop: "0.25rem", color: data.liquid_cashflow_monthly >= 0 ? "#16a34a" : "#ef4444" }}>
              {formatCurrency(data.liquid_cashflow_monthly)}
            </h3>
          </div>
          <div>
            <span style={{ color: "#6b7280", fontSize: "0.85rem" }}>Properties</span>
            <h3 style={{ marginTop: "0.25rem" }}>{data.property_count}</h3>
          </div>
          <div>
            <span style={{ color: "#6b7280", fontSize: "0.85rem" }}>Stock holdings</span>
            <h3 style={{ marginTop: "0.25rem" }}>{data.stock_count}</h3>
          </div>
        </div>
      </div>

      <div className="card" style={{ height: 320 }}>
        <h3 style={{ marginTop: 0 }}>Net worth trend</h3>
        <ResponsiveContainer width="100%" height="85%">
          <LineChart data={data.timeline}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="as_of" hide />
            <YAxis hide domain={["auto", "auto"]} />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              labelFormatter={(label) => new Date(label).toLocaleDateString()}
            />
            <Line type="monotone" dataKey="net_worth" stroke="#2563eb" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card" style={{ display: "grid", gap: "1rem" }}>
        <h3 style={{ margin: 0 }}>Allocation</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem" }}>
          <div>
            <span style={{ color: "#6b7280", fontSize: "0.85rem" }}>Real estate equity</span>
            <h2 style={{ margin: "0.4rem 0" }}>{formatCurrency(data.allocation.properties_value)}</h2>
            <p style={{ color: "#6b7280", fontSize: "0.85rem" }}>
              Based on latest valuations and RentCast data.
            </p>
          </div>
          <div>
            <span style={{ color: "#6b7280", fontSize: "0.85rem" }}>Equities value</span>
            <h2 style={{ margin: "0.4rem 0" }}>{formatCurrency(data.allocation.stocks_value)}</h2>
            <p style={{ color: "#6b7280", fontSize: "0.85rem" }}>
              Calculated using your reported share counts and prices.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
