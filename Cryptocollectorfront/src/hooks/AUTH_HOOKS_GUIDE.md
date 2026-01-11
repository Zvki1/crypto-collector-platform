# 🎣 Utilisation des Hooks d'Authentification

## Option 1: Hook useAuth (Simple)

Le hook `useAuth` peut être utilisé dans n'importe quel composant pour accéder aux fonctionnalités d'authentification.

### Exemple d'utilisation:

```tsx
import { useAuth } from "../hooks/useAuth";

export default function MyComponent() {
  const { user, isAuthenticated, login, logout, isAdmin } = useAuth();

  if (!isAuthenticated) {
    return <div>Veuillez vous connecter</div>;
  }

  return (
    <div>
      <h1>Bienvenue {user?.username}</h1>
      <p>Email: {user?.email}</p>
      {isAdmin() && <p>Vous êtes administrateur</p>}
      <button onClick={logout}>Se déconnecter</button>
    </div>
  );
}
```

## Option 2: Context AuthProvider (Avancé)

Le contexte `AuthProvider` permet de partager l'état d'authentification dans toute l'application sans passer les props.

### 1. Envelopper l'application avec AuthProvider:

```tsx
// main.tsx ou App.tsx
import { AuthProvider } from "./contexts/AuthContext";

root.render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
```

### 2. Utiliser le contexte dans les composants:

```tsx
import { useAuthContext } from "../contexts/AuthContext";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthContext();

  return (
    <nav>
      {isAuthenticated ? (
        <>
          <span>Bonjour {user?.username}</span>
          <button onClick={logout}>Déconnexion</button>
        </>
      ) : (
        <Link to="/connexion">Connexion</Link>
      )}
    </nav>
  );
}
```

## Méthodes disponibles:

### `user`

Objet contenant les informations de l'utilisateur connecté:

```typescript
{
  id: string;
  email: string;
  username: string;
  role: string;
}
```

### `isAuthenticated`

Boolean indiquant si l'utilisateur est connecté.

### `isLoading`

Boolean indiquant si la vérification de l'authentification est en cours.

### `login(email, password)`

Fonction pour connecter un utilisateur:

```tsx
const handleLogin = async () => {
  const result = await login("user@email.com", "password123");
  if (result.success) {
    console.log("Connecté!", result.user);
  } else {
    console.error("Erreur:", result.error);
  }
};
```

### `logout()`

Fonction pour déconnecter l'utilisateur:

```tsx
const handleLogout = () => {
  logout();
  navigate("/connexion");
};
```

### `isAdmin()`

Fonction pour vérifier si l'utilisateur est admin:

```tsx
{
  isAdmin() && <AdminPanel />;
}
```

## Exemples complets:

### Exemple 1: Affichage conditionnel basé sur le rôle

```tsx
import { useAuth } from "../hooks/useAuth";

export default function Dashboard() {
  const { user, isAdmin } = useAuth();

  return (
    <div>
      <h1>Tableau de bord</h1>

      {/* Contenu pour tous les utilisateurs */}
      <UserStats user={user} />

      {/* Contenu uniquement pour les admins */}
      {isAdmin() && (
        <div>
          <h2>Panneau d'administration</h2>
          <AdminPanel />
        </div>
      )}
    </div>
  );
}
```

### Exemple 2: Formulaire de login avec le hook

```tsx
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await login(email, password);

    if (result.success) {
      toast.success("Connexion réussie!");
      navigate("/dashboard");
    } else {
      toast.error(result.error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Mot de passe"
      />
      <button type="submit">Se connecter</button>
    </form>
  );
}
```

### Exemple 3: Affichage pendant le chargement

```tsx
import { useAuth } from "../hooks/useAuth";

export default function App() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  return <div>{isAuthenticated ? <Dashboard /> : <LoginPage />}</div>;
}
```

## Différence entre useAuth et useAuthContext:

- **`useAuth`**: Hook autonome, peut être utilisé sans provider
- **`useAuthContext`**: Nécessite `AuthProvider`, partage l'état globalement

Utilisez `useAuth` si vous n'avez pas besoin de partager l'état entre de nombreux composants.
Utilisez `useAuthContext` avec `AuthProvider` pour une gestion d'état globale.
