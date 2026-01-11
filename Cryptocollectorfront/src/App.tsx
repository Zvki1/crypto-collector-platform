import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useState, useEffect } from "react";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import DashboardPage from "./pages/DashboardPage";
import CryptoListPage from "./pages/CryptoListPage";
import AlertsPage from "./pages/AlertsPage";
import PortfolioPage from "./pages/PortfolioPage";
import ForecastPage from "./pages/ForecastPage";
import AdminPage from "./pages/AdminPage";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import { authService } from "./services/api";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Vérifier si l'utilisateur est authentifié au chargement
    const isAuth = authService.isAuthenticated();
    if (isAuth) {
      const storedUser = authService.getUser();
      setUser(storedUser);
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (userData: any) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/connexion"
          element={
            isAuthenticated ? (
              <Navigate to="/tableau-de-bord" />
            ) : (
              <LoginPage onLogin={handleLogin} />
            )
          }
        />
        <Route
          path="/inscription"
          element={
            isAuthenticated ? (
              <Navigate to="/tableau-de-bord" />
            ) : (
              <RegisterPage />
            )
          }
        />
        <Route
          path="/reinitialiser-mot-de-passe"
          element={
            isAuthenticated ? (
              <Navigate to="/tableau-de-bord" />
            ) : (
              <ResetPasswordPage />
            )
          }
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/tableau-de-bord" />} />
          <Route path="tableau-de-bord" element={<DashboardPage />} />
          <Route path="cryptomonnaies" element={<CryptoListPage />} />
          <Route path="alertes" element={<AlertsPage />} />
          <Route path="portefeuille" element={<PortfolioPage />} />
          <Route path="portfolio" element={<PortfolioPage />} />{" "}
          {/* Route temporaire pour Stripe */}
          <Route path="previsions" element={<ForecastPage />} />
          <Route
            path="admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminPage user={user} />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </Router>
  );
}
