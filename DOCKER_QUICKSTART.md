# 🚀 Guide de Démarrage Rapide Docker

## 📦 Trois façons de lancer le système

### 1️⃣ **MODE SIMPLE (Recommandé pour dev) - SANS Nginx**

Le frontend utilise le serveur de développement Vite (hot reload).

```bash
# Créer le fichier .env
cp .env.example .env

# Démarrer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f
```

**Accès:**

- Frontend: http://localhost:5173 (Vite dev server)
- API: http://localhost:3000
- PgAdmin: http://localhost:5050
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001

---

### 2️⃣ **MODE AVEC NGINX (Optionnel)**

Le frontend est buildé et servi par Nginx (plus proche de la production).

```bash
# Démarrer avec Nginx
docker-compose -f docker-compose.yml -f docker-compose.nginx.yml up -d
```

**Accès:**

- Frontend: http://localhost (Nginx)
- API: http://localhost:3000
- Tout le reste: comme au-dessus

---

### 3️⃣ **MODE PRODUCTION**

Avec toutes les optimisations, limites de ressources, et logs rotatifs.

```bash
# Démarrer en production
docker-compose -f docker-compose.prod.yml up -d
```

---

## 🔧 Commandes Utiles

```bash
# Arrêter tous les services
docker-compose down

# Arrêter et supprimer les volumes (⚠️ supprime les données)
docker-compose down -v

# Reconstruire les images
docker-compose build --no-cache

# Voir les logs d'un service spécifique
docker-compose logs -f api
docker-compose logs -f frontend

# Redémarrer un service
docker-compose restart api

# Voir l'état des services
docker-compose ps
```

---

## 🎯 Services Disponibles

| Service        | Port | Description                  |
| -------------- | ---- | ---------------------------- |
| **frontend**   | 5173 | Application React (Vite dev) |
| **api**        | 3000 | API NestJS                   |
| **postgres**   | 5432 | Base de données PostgreSQL   |
| **redis**      | 6379 | Cache et Queue               |
| **pgadmin**    | 5050 | Interface PostgreSQL         |
| **prometheus** | 9090 | Métriques                    |
| **grafana**    | 3001 | Dashboards                   |

---

## 📝 Configuration Minimale

Éditez le fichier `.env` :

```env
# Obligatoire
JWT_SECRET=votre-cle-secrete-tres-forte

# Optionnel (mais recommandé)
COINGECKO_API_KEY=votre-cle-api
```

---

## ❓ FAQ

### **Q: Nginx est obligatoire ?**

**R:** Non ! Par défaut, on utilise le serveur Vite (plus rapide pour le dev avec hot reload).

### **Q: Quand utiliser Nginx ?**

**R:** Pour la production ou si vous voulez tester un environnement proche de la prod.

### **Q: Comment désactiver le monitoring (Prometheus/Grafana) ?**

**R:** Commentez les services `prometheus` et `grafana` dans le docker-compose.yml

### **Q: Les migrations sont automatiques ?**

**R:** Oui ! L'API exécute `prisma migrate deploy` au démarrage.

---

## 🐛 Problèmes Courants

### Le frontend ne se connecte pas à l'API

Vérifiez la variable d'environnement dans le frontend :

```env
VITE_API_URL=http://localhost:3000
```

### "Port already in use"

Changez le port dans docker-compose.yml :

```yaml
ports:
  - '3001:3000' # Utilisez 3001 au lieu de 3000
```

### Besoin de réinitialiser la base de données

```bash
docker-compose down -v
docker-compose up -d
```

---

## 🔥 Démarrage en 3 commandes

```bash
cp .env.example .env
docker-compose build
docker-compose up -d
```

C'est tout ! 🎉
