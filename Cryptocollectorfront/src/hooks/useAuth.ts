import { useState, useEffect } from "react";
import { authService } from "../services/api";

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    const isAuth = authService.isAuthenticated();
    const currentUser = authService.getUser();

    setIsAuthenticated(isAuth);
    setUser(currentUser);
    setIsLoading(false);
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password });
      setUser(response.user);
      setIsAuthenticated(true);
      return { success: true, user: response.user };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur de connexion",
      };
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const isAdmin = () => {
    return user?.role === "admin";
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    isAdmin,
    checkAuth,
  };
}
