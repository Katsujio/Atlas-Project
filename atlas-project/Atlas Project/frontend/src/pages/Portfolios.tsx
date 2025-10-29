import { FormEvent, useState } from "react";

import { usePortfolios } from "../api/hooks";

const PortfoliosPage = () => {
  const { listQuery, createMutation, updateMutation, deleteMutation } = usePortfolios();
  const [name, setName] = useState("");
  const [renameValue, setRenameValue] = useState<Record<number, string>>({});

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate({ name }, { onSuccess: () => setName("") });
  };

  const handleRename = (id: number) => {
    const nextName = renameValue[id];
    if (!nextName?.trim()) return;
    updateMutation.mutate({ id, payload: { name: nextName } });
  };

  const portfolios = listQuery.data?.items ?? [];

  return (
    <div className="form-grid" style={{ gap: "1.5rem" }}>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Create portfolio</h2>
        <form className="form-grid" onSubmit={handleCreate} style={{ gridTemplateColumns: "1fr auto" }}>
          <input
            placeholder="e.g. Retirement account"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <button className="btn btn-primary" type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Adding..." : "Add"}
          </button>
        </form>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Your portfolios</h2>
        {listQuery.isLoading ? (
          <p>Loading portfolios...</p>
        ) : portfolios.length === 0 ? (
          <p style={{ color: "#6b7280" }}>Create a portfolio to start tracking holdings.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th style={{ width: 180 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {portfolios.map((portfolio) => (
                <tr key={portfolio.id}>
                  <td>
                    <input
                      value={renameValue[portfolio.id] ?? portfolio.name}
                      onChange={(event) =>
                        setRenameValue((prev) => ({ ...prev, [portfolio.id]: event.target.value }))
                      }
                    />
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        className="btn btn-secondary"
                        type="button"
                        onClick={() => handleRename(portfolio.id)}
                        disabled={updateMutation.isPending}
                      >
                        Save
                      </button>
                      <button
                        className="btn"
                        style={{ background: "#fee2e2", color: "#b91c1c" }}
                        type="button"
                        onClick={() => deleteMutation.mutate(portfolio.id)}
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

export default PortfoliosPage;
