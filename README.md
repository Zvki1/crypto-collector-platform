# 📊 Crypto Collector Platform

> Plateforme automatisée de collecte et d'analyse de données de cryptomonnaies en temps réel

[![NestJS](https://img.shields.io/badge/NestJS-11.0.1-E0234E?logo=nestjs)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?logo=postgresql)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19.0-2D3748?logo=prisma)](https://www.prisma.io/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](https://www.docker.com/)

---

## 🎯 Vue d'Ensemble

La **Crypto Collector Platform** est une solution complète de collecte et de stockage de données de marché pour les cryptomonnaies. Elle récupère automatiquement les informations depuis l'API CoinGecko toutes les 5 minutes et les stocke dans une base de données PostgreSQL pour analyse ultérieure.

### ✨ Fonctionnalités Principales

- 🔄 **Collecte automatique** toutes les 5 minutes (configurable)
- 📊 **Suivi de Bitcoin, Ethereum et Solana**
- 💾 **Stockage historique** dans PostgreSQL
- 📈 **Données complètes**: prix, volumes, capitalisation, ATH/ATL, etc.
- 🔍 **Dashboard de monitoring** (Bull Board)
- 🐳 **Infrastructure Docker** complète
- 🚀 **Architecture NestJS** modulaire et scalable

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│             Docker Compose                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │PostgreSQL│  │  Redis   │  │ PgAdmin  │     │
│  │  :5432   │  │  :6379   │  │  :5050   │     │
│  └──────────┘  └──────────┘  └──────────┘     │
└─────────────────────────────────────────────────┘
         ▲                              ▲
         │                              │
    ┌────┴─────┐                  ┌────┴─────┐
    │Collector │                  │   API    │
    │  :3001   │                  │  :3000   │
    │          │                  │          │
    │• Scheduler                  │• REST    │
    │• Bull Queue                 │• CRUD    │
    │• CoinGecko                  │          │
    └──────────┘                  └──────────┘
```

### 📁 Structure du Projet

```
crypto-collector-platform/
├── apps/                    # Applications
│   ├── collector/          # Service de collecte automatique
│   └── api/               # API REST
├── libs/                   # Librairies partagées
│   ├── common/            # Services communs
│   └── database/          # Module Prisma
├── prisma/                # Schéma et migrations BDD
├── docker/                # Configuration Docker
└── docs/                  # Documentation complète
```

---

## 🚀 Démarrage Rapide

### Prérequis

- **Node.js** v18+
- **npm** v9+
- **Docker** & **Docker Compose**

### Installation

```bash
# 1. Cloner le repository
git clone <repository-url>
cd crypto-collector-platform

# 2. Installer les dépendances
npm install

# 3. Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos paramètres

# 4. Démarrer l'infrastructure Docker
docker-compose up -d

# 5. Générer le client Prisma et exécuter les migrations
npx prisma generate
npx prisma migrate deploy

# 6. Démarrer le Collector
npm run start:dev collector
```

### Vérification

Après le démarrage, vous devriez voir :

```
✅ Collector is running and will collect data periodically
📋 Bull Board dashboard: http://localhost:3001/admin/queues
🚀 Crypto Collector starting...
📊 Collecting data for: bitcoin, ethereum, solana
⏱️  Collection interval: 5 minutes
```

---

## 📊 Services Disponibles

| Service        | URL                                | Description             |
| -------------- | ---------------------------------- | ----------------------- |
| **Collector**  | http://localhost:3001              | Service de collecte     |
| **Bull Board** | http://localhost:3001/admin/queues | Dashboard de monitoring |
| **API REST**   | http://localhost:3000              | API de consultation     |
| **PgAdmin**    | http://localhost:5050              | Interface BDD           |
| **PostgreSQL** | localhost:5432                     | Base de données         |
| **Redis**      | localhost:6379                     | Queue backend           |

### Credentials PgAdmin

- **Email**: rzaki@hotmail.fr
- **Password**: admin

### Credentials PostgreSQL

- **User**: crypto_user
- **Password**: crypto_password_dev
- **Database**: crypto_platform

---

## 🛠️ Commandes Disponibles

### Développement

```bash
# Démarrer le Collector en mode développement
npm run start:dev collector

# Démarrer l'API en mode développement
npm run start:dev api

# Build toutes les applications
npm run build
```

### Base de Données

```bash
# Interface graphique Prisma Studio
npx prisma studio

# Créer une nouvelle migration
npx prisma migrate dev --name migration_name

# Appliquer les migrations
npx prisma migrate deploy

# Générer le client Prisma
npx prisma generate
```

### Tests

```bash
# Tests unitaires
npm run test

# Tests E2E
npm run test:e2e

# Coverage
npm run test:cov
```

### Docker

```bash
# Démarrer tous les services
docker-compose up -d

# Arrêter tous les services
docker-compose down

# Voir les logs
docker-compose logs -f

# Voir le status
docker-compose ps
```

### Linting & Formatting

```bash
# ESLint
npm run lint

# Prettier
npm run format
```

---

## 📚 Documentation

Documentation complète disponible dans le dossier `docs/` :

- **[PROJECT_DOCUMENTATION.md](docs/PROJECT_DOCUMENTATION.md)** - Documentation générale du projet
- **[TECHNICAL_GUIDE.md](docs/TECHNICAL_GUIDE.md)** - Guide technique pour développeurs

### Sujets Couverts

- 🏛️ Architecture détaillée
- 🔄 Flow de données complet
- 🧩 Composants et services
- 🗄️ Schéma de base de données
- 🌐 Intégration API CoinGecko
- 🐛 Debugging & Troubleshooting
- 📐 Conventions de code
- 🗺️ Roadmap et améliorations futures

---

## 🎯 Technologies Utilisées

### Backend

- **NestJS** 11.0.1 - Framework Node.js
- **TypeScript** 5.7.3 - Langage
- **Prisma** 6.19.0 - ORM
- **Bull** 4.16.5 - Queue/Jobs
- **Axios** 1.13.2 - HTTP Client

### Base de Données

- **PostgreSQL** 15 - Base de données relationnelle
- **Redis** 7 - Cache & Queue backend

### DevOps

- **Docker** - Conteneurisation
- **Docker Compose** - Orchestration

---

## 📈 État Actuel

### ✅ Implémenté

- ✅ Architecture monorepo NestJS
- ✅ Service de collecte automatique
- ✅ Intégration API CoinGecko avec rate limiting
- ✅ Système de queues Bull + Redis
- ✅ Dashboard Bull Board
- ✅ Base de données PostgreSQL + Prisma
- ✅ Modèles de données complets
- ✅ Infrastructure Docker complète
- ✅ Configuration centralisée
- ✅ Logs structurés

### 🚧 En Cours

- ⚠️ API REST (endpoints CRUD à implémenter)
- ⚠️ Tests unitaires et E2E
- ⚠️ Documentation API (Swagger)

---

## 🗺️ Roadmap

### Court Terme

- [ ] Compléter l'API REST
- [ ] Ajouter Swagger/OpenAPI
- [ ] Tests (>80% coverage)
- [ ] CI/CD Pipeline

### Moyen Terme

- [ ] Support de plus de cryptomonnaies
- [ ] Données OHLCV
- [ ] Système d'alertes (email, push)
- [ ] Analytics & indicateurs techniques
- [ ] WebSockets temps réel

### Long Terme

- [ ] Dashboard web (React/Vue)
- [ ] Application mobile
- [ ] Trading bot framework
- [ ] Portfolio tracking
- [ ] AI/ML pour prédictions

---

## 📊 Tests de Performance

La plateforme inclut une suite complète de tests de performance avec **k6** pour évaluer la scalabilité et la latence du système.

### 🚀 Démarrage rapide

```bash
# Installer k6
brew install k6

# Lancer le test basique
npm run perf:test
```

### 📁 Tests disponibles

| Commande               | Description            | Durée  | Utilisateurs |
| ---------------------- | ---------------------- | ------ | ------------ |
| `npm run perf:test`    | Test de charge basique | 30s    | 10           |
| `npm run perf:spike`   | Test de pic de charge  | ~2min  | 2→50         |
| `npm run perf:stress`  | Test de stress         | ~10min | 0→100        |
| `npm run perf:auth`    | Test authentification  | 30s    | 5            |
| `npm run perf:cryptos` | Test endpoints cryptos | ~4min  | 10→20        |
| `npm run perf:all`     | Tous les tests         | ~20min | Variable     |

### 📚 Documentation

- 📖 [Guide de démarrage rapide](./performance-tests/QUICKSTART.md)
- 📖 [Documentation complète](./performance-tests/PERFORMANCE_TESTING.md)
- 📊 [Exemples de résultats](./performance-tests/EXAMPLES.md)

### 🎯 Métriques clés

- ✅ **Temps de réponse moyen** : < 200ms
- ✅ **P95** (95e percentile) : < 500ms
- ✅ **Taux d'erreur** : < 1%
- ✅ **Débit** : > 50 requêtes/seconde

---

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push sur la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

---

## 📞 Contact

**Zakaria Reguieg**

- Email: rzaki@hotmail.fr
- GitHub: [@Zvki1](https://github.com/Zvki1)

**Repository**: [crypto-collector-platform](https://github.com/Zvki1/crypto-collector-platform)

---

## 📄 License

UNLICENSED - Projet privé

---

## 🙏 Remerciements

- [NestJS](https://nestjs.com/) - Framework extraordinaire
- [Prisma](https://www.prisma.io/) - ORM moderne et puissant
- [CoinGecko](https://www.coingecko.com/) - API de données crypto
- [Bull](https://github.com/OptimalBits/bull) - Système de queues robuste

---

**Dernière mise à jour**: 22 novembre 2025
