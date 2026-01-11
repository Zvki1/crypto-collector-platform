// Exemple d'utilisation du service API pour des requêtes authentifiées

import { fetchWithAuth } from "../services/api";

// Exemple 1: Récupérer des données protégées
export async function getCryptoData() {
  try {
    const response = await fetchWithAuth("/api/crypto", {
      method: "GET",
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des données:", error);
    throw error;
  }
}

// Exemple 2: Créer une ressource
export async function createAlert(alertData: any) {
  try {
    const response = await fetchWithAuth("/api/alerts", {
      method: "POST",
      body: JSON.stringify(alertData),
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (error) {
    console.error("Erreur lors de la création de l'alerte:", error);
    throw error;
  }
}

// Exemple 3: Mettre à jour une ressource
export async function updatePortfolio(portfolioId: string, portfolioData: any) {
  try {
    const response = await fetchWithAuth(`/api/portfolio/${portfolioId}`, {
      method: "PUT",
      body: JSON.stringify(portfolioData),
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (error) {
    console.error("Erreur lors de la mise à jour du portfolio:", error);
    throw error;
  }
}

// Exemple 4: Supprimer une ressource
export async function deleteAlert(alertId: string) {
  try {
    const response = await fetchWithAuth(`/api/alerts/${alertId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      return true;
    }
  } catch (error) {
    console.error("Erreur lors de la suppression de l'alerte:", error);
    throw error;
  }
}
