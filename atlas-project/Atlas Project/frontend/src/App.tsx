import { Navigate, Route, Routes } from "react-router-dom";

import AppHeader from "./components/AppHeader";
import { useAuth } from "./context/AuthContext";
import DashboardPage from "./pages/Dashboard";
import LoginPage from "./pages/Login";
import NotFoundPage from "./pages/NotFound";
import PortfoliosPage from "./pages/Portfolios";
import PropertiesPage from "./pages/Properties";
import RegisterPage from "./pages/Register";
import StocksPage from "./pages/Stocks";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return <div className="container">Loading...</div>;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const App = () => {
  const { isAuthenticated, isLoading, user, logout } = useAuth();

  if (isLoading) {
    return <div className="container" style={{ padding: "3rem 0" }}>Loading...</div>;
  }

  return (
    <div className="app-shell">
      {isAuthenticated && user && <AppHeader email={user.email} onLogout={logout} />}
      <main className="container" style={{ padding: "2rem 0", flex: 1 }}>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/portfolios"
            element={
              <ProtectedRoute>
                <PortfoliosPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/properties"
            element={
              <ProtectedRoute>
                <PropertiesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/stocks"
            element={
              <ProtectedRoute>
                <StocksPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
          <Route
            path="/register"
            element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
