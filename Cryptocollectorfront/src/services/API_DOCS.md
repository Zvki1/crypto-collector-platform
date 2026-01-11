# Service d'Authentification

## Configuration

L'application utilise un service d'authentification qui communique avec l'API backend sur `http://localhost:3000`.

## Fonctionnalités

### 1. Login

```typescript
import { authService } from "./services/api";

const response = await authService.login({
  email: "rzaki1@hotmail.fr",
  password: "Zakaria270001",
});
```

Le service stocke automatiquement:

- Le token JWT dans `localStorage.access_token`
- Les informations utilisateur dans `localStorage.user`

### 2. Logout

```typescript
authService.logout();
```

### 3. Vérifier l'authentification

```typescript
const isAuth = authService.isAuthenticated();
const user = authService.getUser();
const token = authService.getToken();
```

### 4. Requêtes authentifiées

```typescript
import { fetchWithAuth } from "./services/api";

const response = await fetchWithAuth("/api/protected-route", {
  method: "GET",
});
```

La fonction `fetchWithAuth` ajoute automatiquement le token Bearer dans les headers et redirige vers la page de connexion si le token est invalide (401).

## Protection des routes

Les routes protégées utilisent le composant `ProtectedRoute`:

```tsx
// Route protégée simple
<Route
  path="tableau-de-bord"
  element={
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  }
/>

// Route protégée avec rôle spécifique
<Route
  path="admin"
  element={
    <ProtectedRoute requiredRole="admin">
      <AdminPage />
    </ProtectedRoute>
  }
/>
```

## Structure de la réponse du backend

```typescript
{
  access_token: string;
  user: {
    id: string;
    email: string;
    username: string;
    role: string;
  }
}
```

## Gestion des erreurs

Le service gère automatiquement:

- Les erreurs de connexion (401 Unauthorized)
- Les erreurs réseau
- L'expiration du token (redirection automatique vers /connexion)

## Compte de test

- Email: `rzaki1@hotmail.fr`
- Mot de passe: `Zakaria270001`
