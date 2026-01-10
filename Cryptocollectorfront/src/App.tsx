import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import CryptoListPage from './pages/CryptoListPage';
import AlertsPage from './pages/AlertsPage';
import PortfolioPage from './pages/PortfolioPage';
import AnalysisPage from './pages/AnalysisPage';
import ForecastPage from './pages/ForecastPage';
import AdminPage from './pages/AdminPage';
import Layout from './components/Layout';

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import CryptoListPage from './pages/CryptoListPage';
import AlertsPage from './pages/AlertsPage';
import PortfolioPage from './pages/PortfolioPage';
import AnalysisPage from './pages/AnalysisPage';
import ForecastPage from './pages/ForecastPage';
import AdminPage from './pages/AdminPage';
import Layout from './components/Layout';
import { authService } from './services/auth.service';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Charger l'utilisateur depuis le localStorage (token + user)
    const isAuth = authService.isAuthenticated();
    const currentUser = authService.getCurrentUser();

    if (isAuth && currentUser) {
      setUser(currentUser);
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (userData: any) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('cryptoUser');
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
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
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/connexion" />
            )
          }
        >
          <Route index element={<Navigate to="/tableau-de-bord" />} />
          <Route path="tableau-de-bord" element={<DashboardPage />} />
          <Route path="cryptomonnaies" element={<CryptoListPage />} />
          <Route path="alertes" element={<AlertsPage />} />
          <Route path="portefeuille" element={<PortfolioPage />} />
          <Route path="analyse" element={<AnalysisPage />} />
          <Route path="previsions" element={<ForecastPage />} />
          <Route path="admin" element={<AdminPage user={user} />} />
        </Route>
      </Routes>
    </Router>
  );
}
