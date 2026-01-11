import { Navigate } from "react-router-dom";
import { authService } from "../services/api";
import { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
}

export default function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const isAuthenticated = authService.isAuthenticated();
  const user = authService.getUser();

  if (!isAuthenticated) {
    return <Navigate to="/connexion" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/tableau-de-bord" replace />;
  }

  return <>{children}</>;
}
