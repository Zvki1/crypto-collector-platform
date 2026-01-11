const API_BASE_URL = "http://localhost:3000";

interface LoginDto {
  email: string;
  password: string;
}

interface RegisterDto {
  email: string;
  username: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    username: string;
    role: string;
  };
}

export const authService = {
  async login(loginDto: LoginDto): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginDto),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Email ou mot de passe incorrect");
    }

    const result = await response.json();

    // La réponse est dans result.data
    const data = result.data;

    // Stocker le token dans le localStorage
    if (data.access_token) {
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
    }

    return data;
  },

  async register(registerDto: RegisterDto): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(registerDto),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Erreur lors de l'inscription");
    }

    const result = await response.json();
    return result.data || result;
  },

  async getCryptos(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/cryptos`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Erreur lors de la récupération des cryptomonnaies");
    }

    const result = await response.json();
    return result.data || [];
  },

  async getCryptosOverview(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/cryptos/overview`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Erreur lors de la récupération de l'aperçu du marché");
    }

    const result = await response.json();
    return result.data || {};
  },

  async getAlerts(): Promise<any[]> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE_URL}/alerts`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error("Erreur lors de la récupération des alertes");
    }

    const result = await response.json();
    // Si data est un objet unique, on le met dans un tableau
    return Array.isArray(result.data) ? result.data : [result.data];
  },

  async createAlert(alertData: {
    cryptocurrencyId: string;
    type: string;
    targetPrice: number;
  }): Promise<any> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE_URL}/alerts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(alertData),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.message || "Erreur lors de la création de l'alerte"
      );
    }

    const result = await response.json();
    return result.data || result;
  },

  async deleteAlert(id: string): Promise<any> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE_URL}/alerts/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.message || "Erreur lors de la suppression de l'alerte"
      );
    }

    const result = await response.json();
    return result.data || result;
  },

  async toggleAlert(id: string): Promise<any> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE_URL}/alerts/${id}/toggle`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.message || "Erreur lors de la modification du statut de l'alerte"
      );
    }

    const result = await response.json();
    return result.data || result;
  },

  async updateAlert(
    id: string,
    alertData: {
      //   cryptocurrencyId?: string;
      type?: string;
      targetPrice?: number;
    }
  ): Promise<any> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE_URL}/alerts/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(alertData),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.message || "Erreur lors de la modification de l'alerte"
      );
    }

    const result = await response.json();
    return result.data || result;
  },

  async createTransaction(transactionData: {
    type: "BUY" | "SELL";
    cryptocurrencyId: string;
    amount: number;
  }): Promise<any> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE_URL}/portfolio/transaction`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(transactionData),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.message || "Erreur lors de la création de la transaction"
      );
    }

    const result = await response.json();
    return result.data || result;
  },

  async getTransactions(): Promise<any[]> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE_URL}/portfolio/transactions`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error("Erreur lors de la récupération des transactions");
    }

    const result = await response.json();
    return Array.isArray(result.data) ? result.data : [result.data];
  },

  async getPortfolioOverview(): Promise<any> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE_URL}/portfolio/overview`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(
        "Erreur lors de la récupération de l'aperçu du portefeuille"
      );
    }

    const result = await response.json();
    return result.data || {};
  },

  async getBalance(): Promise<any> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE_URL}/payments/balance`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error("Erreur lors de la récupération du solde");
    }

    const result = await response.json();
    return result.data || {};
  },

  async getHoldings(): Promise<any[]> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE_URL}/portfolio/holdings`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error("Erreur lors de la récupération des positions");
    }

    const result = await response.json();
    return Array.isArray(result.data) ? result.data : [];
  },

  async getMarketData(cryptoId: string, days: number = 7): Promise<any> {
    const token = this.getToken();
    const response = await fetch(
      `${API_BASE_URL}/market-data?cryptoId=${cryptoId}&days=${days}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      }
    );

    if (!response.ok) {
      throw new Error("Erreur lors de la récupération des données du marché");
    }

    const result = await response.json();
    return result.data || {};
  },

  async getPredictions(
    cryptoId: string,
    period: 7 | 14 | 30 = 7
  ): Promise<any> {
    const token = this.getToken();
    const response = await fetch(
      `${API_BASE_URL}/predictions/${cryptoId}?period=${period}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.message || "Erreur lors de la récupération des prédictions"
      );
    }

    const result = await response.json();
    return result.data || {};
  },

  async createDeposit(amount: number): Promise<any> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE_URL}/payments/deposit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ amount }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Erreur lors de la création du dépôt");
    }

    const result = await response.json();
    return result.data || result;
  },

  async confirmDeposit(sessionId: string): Promise<any> {
    const token = this.getToken();
    const response = await fetch(
      `${API_BASE_URL}/payments/deposit/confirm?sessionId=${sessionId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.message || "Erreur lors de la confirmation du dépôt"
      );
    }

    const result = await response.json();
    return result.data || result;
  },

  async getDeposits(): Promise<any[]> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE_URL}/payments/deposits`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(
        "Erreur lors de la récupération de l'historique des dépôts"
      );
    }

    const result = await response.json();
    return Array.isArray(result.data) ? result.data : [result.data];
  },

  logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
  },

  getToken(): string | null {
    return localStorage.getItem("access_token");
  },

  getUser() {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};

// Intercepteur pour ajouter le token aux requêtes
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = authService.getToken();

  const headers = {
    ...options.headers,
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Token invalide ou expiré
    authService.logout();
    window.location.href = "/connexion";
  }

  return response;
}
