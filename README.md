# Crypto Collector Platform

Plateforme de collecte, d'analyse et de gestion de portefeuille de cryptomonnaies.

---

## Presentation

Ce projet est une application web complete permettant de suivre les cours des cryptomonnaies en temps reel, gerer un portefeuille virtuel, configurer des alertes de prix et effectuer des transactions simulees.

Le systeme collecte automatiquement les donnees de marche depuis l'API CoinGecko et les stocke pour permettre une analyse historique.

---

## Fonctionnalites implementees

### Backend (API REST)

- Authentification JWT avec gestion des roles (utilisateur, admin, superadmin)
- Gestion des utilisateurs (inscription, connexion, profil)
- Catalogue des cryptomonnaies avec donnees de marche en temps reel
- Systeme de portefeuille avec solde en euros
- Transactions d'achat et de vente de cryptomonnaies
- Systeme d'alertes de prix (au-dessus ou en-dessous d'un seuil)
- Integration Stripe pour les depots
- Notifications par email
- Module de predictions (structure en place)

### Service Collector

- Collecte automatique des donnees toutes les 5 minutes
- Integration CoinGecko avec rate limiting
- File d'attente Bull/Redis pour le traitement des jobs
- Dashboard de monitoring Bull Board
- Metriques Prometheus

### Frontend (React + TypeScript)

- Interface de connexion et inscription
- Tableau de bord principal
- Liste des cryptomonnaies avec prix en temps reel
- Page de gestion du portefeuille
- Configuration des alertes
- Page d'analyse
- Page de previsions
- Interface d'administration

### Infrastructure

- PostgreSQL pour le stockage des donnees
- Redis pour les files d'attente
- Docker Compose pour l'orchestration
- Prometheus et Grafana pour le monitoring

---

## Modele de donnees

Le schema de base de donnees comprend les entites suivantes :

- Cryptocurrency : informations de base sur chaque crypto
- MarketData : historique des prix et volumes
- User : comptes utilisateurs avec roles
- Portfolio : portefeuille lie a un utilisateur
- Transaction : achats et ventes de crypto
- Deposit : depots via Stripe
- Alert : alertes de prix configurees

---

## Structure du projet

```
crypto-collector-platform/
├── apps/
│   ├── api/              # API REST NestJS
│   └── collector/        # Service de collecte
├── libs/
│   ├── common/           # Services partages
│   └── database/         # Module Prisma
├── Cryptocollectorfront/ # Application React
├── prisma/               # Schema et migrations
├── monitoring/           # Configuration Prometheus/Grafana
├── performance-tests/    # Tests de charge k6
└── docs/                 # Documentation
```

---

## Demarrage

### Prerequis

- Node.js v18 ou superieur
- Docker et Docker Compose
- npm v9 ou superieur

### Installation

```bash
# Cloner le repository
git clone https://github.com/Zvki1/crypto-collector-platform
cd crypto-collector-platform

# Installer les dependances
npm install

# Configurer l'environnement
cp .env.example .env

# Demarrer l'infrastructure
docker-compose up -d

# Appliquer les migrations
npx prisma generate
npx prisma migrate deploy

# Demarrer l'API
npm run start:dev api

# Demarrer le collector (dans un autre terminal)
npm run start:dev collector
```

### Frontend

```bash
cd Cryptocollectorfront
npm install
npm run dev
```

---

## Services et ports

| Service    | Port  | Description                    |
| ---------- | ----- | ------------------------------ |
| API        | 3000  | API REST                       |
| Collector  | 10000 | Service de collecte            |
| Frontend   | 5173  | Interface web                  |
| PostgreSQL | 5432  | Base de donnees                |
| Redis      | 6379  | File d'attente                 |
| PgAdmin    | 5050  | Administration BDD             |
| grafana    | 3001  | visualisation des performances |

---

## Commandes utiles

```bash
# Tests unitaires
npm run test

# Tests end-to-end
npm run test:e2e

# Couverture de code
npm run test:cov

# Linting
npm run lint

# Tests de performance
npm run perf:test
```

---

## Technologies

- NestJS 11
- TypeScript 5.7
- Prisma 6.19
- PostgreSQL 15
- Redis 7
- Bull Queue
- React 18
- Stripe
- Prometheus
- Grafana
- SonarQube
- Snyk
- K6

---

## Contact

Zakaria Reguieg  
Email : rzaki@hotmail.fr  
GitHub : github.com/Zvki1
