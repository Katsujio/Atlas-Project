import { NavLink } from "react-router-dom";

type AppHeaderProps = {
  email: string;
  onLogout: () => void;
};

const AppHeader = ({ email, onLogout }: AppHeaderProps) => {
  return (
    <header className="header">
      <div className="container header-nav">
        <NavLink to="/" style={{ fontWeight: 700, fontSize: "1.1rem" }}>
          Atlas Portfolio
        </NavLink>
        <nav className="nav-links">
          <NavLink to="/" end>
            Dashboard
          </NavLink>
          <NavLink to="/portfolios">Portfolios</NavLink>
          <NavLink to="/properties">Properties</NavLink>
          <NavLink to="/stocks">Stocks</NavLink>
          <span className="pill">{email}</span>
          <button className="btn btn-secondary" onClick={onLogout}>
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
};

export default AppHeader;
