# 📊 Crypto Collector Platform - Documentation Projet

> **Date de création:** 22 novembre 2025  
> **Version:** 0.0.1  
> **Auteur:** Zakaria Reguieg

---

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture du Projet](#architecture-du-projet)
3. [Technologies Utilisées](#technologies-utilisées)
4. [Fonctionnalités Implémentées](#fonctionnalités-implémentées)
5. [Structure des Données](#structure-des-données)
6. [Configuration et Déploiement](#configuration-et-déploiement)
7. [État Actuel du Projet](#état-actuel-du-projet)
8. [Roadmap & Améliorations Futures](#roadmap--améliorations-futures)

---

## 🎯 Vue d'ensemble

### Objectif du Projet

La **Crypto Collector Platform** est une plateforme de collecte et d'analyse de données de cryptomonnaies en temps réel. Elle récupère automatiquement les informations de marché depuis l'API CoinGecko et les stocke dans une base de données pour analyse et consultation ultérieure.

### Cas d'Usage

- 📈 Suivi historique des prix de cryptomonnaies
- 📊 Analyse de tendances de marché
- 🔔 Base pour système d'alertes de prix (futur)
- 📉 Backtesting de stratégies de trading (futur)
- 📱 Alimentation d'applications mobiles/web (futur)

### Cryptomonnaies Suivies

Actuellement, la plateforme collecte les données pour :

- **Bitcoin (BTC)**
- **Ethereum (ETH)**
- **Solana (SOL)**

---

## 🏗️ Architecture du Projet

### Architecture Globale

Le projet utilise une **architecture monorepo NestJS** avec plusieurs applications et librairies partagées :

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Compose                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │PostgreSQL│  │  Redis   │  │ PgAdmin  │  │  Apps    │   │
│  │  :5432   │  │  :6379   │  │  :5050   │  │          │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                           ▲
                           │
        ┌──────────────────┴──────────────────┐
        │                                      │
   ┌────▼─────┐                          ┌────▼─────┐
   │Collector │                          │   API    │
   │  :3001   │                          │  :3000   │
   │          │                          │          │
   │ • Scheduler                         │ • REST   │
   │ • Bull Queue                        │ • CRUD   │
   │ • CoinGecko                         │          │
   └──────────┘                          └──────────┘
        │                                      │
        └──────────────────┬──────────────────┘
                           │
                    ┌──────▼──────┐
                    │   Prisma    │
                    │     ORM     │
                    └─────────────┘
```

### Architecture Technique (Monorepo)

```
crypto-collector-platform/
├── apps/                          # Applications
│   ├── collector/                 # Service de collecte
│   │   ├── src/
│   │   │   ├── config/           # Configuration du collector
│   │   │   ├── jobs/             # Bull Jobs (workers)
│   │   │   ├── services/         # Services métier
│   │   │   ├── collector.module.ts
│   │   │   ├── collector.scheduler.ts
│   │   │   └── main.ts           # Entry point
│   │   └── types/                # Types TypeScript
│   │
│   └── api/                      # API REST
│       ├── src/
│       │   ├── api.module.ts
│       │   ├── api.controller.ts
│       │   ├── api.service.ts
│       │   └── main.ts
│       └── test/
│
├── libs/                         # Librairies partagées
│   ├── common/                   # Services communs
│   │   └── src/
│   └── database/                 # Module base de données
│       └── src/
│           ├── database.module.ts
│           └── database.service.ts
│
├── prisma/                       # ORM Prisma
│   ├── schema.prisma            # Schéma de la BDD
│   └── migrations/              # Migrations SQL
│
├── docker/                      # Configuration Docker
├── docs/                        # Documentation
└── docker-compose.yml          # Orchestration containers
```

---

## 🛠️ Technologies Utilisées

### Backend Framework

| Technologie    | Version | Rôle                        |
| -------------- | ------- | --------------------------- |
| **NestJS**     | 11.0.1  | Framework Node.js principal |
| **TypeScript** | 5.7.3   | Langage de programmation    |
| **Node.js**    | -       | Runtime JavaScript          |

### Base de Données

| Technologie    | Version   | Rôle                            |
| -------------- | --------- | ------------------------------- |
| **PostgreSQL** | 15-alpine | Base de données relationnelle   |
| **Prisma**     | 6.19.0    | ORM (Object-Relational Mapping) |
| **PgAdmin**    | Latest    | Interface d'administration BDD  |

### Queue & Jobs

| Technologie    | Version  | Rôle                               |
| -------------- | -------- | ---------------------------------- |
| **Bull**       | 4.16.5   | Système de queues et jobs          |
| **Redis**      | 7-alpine | Cache et backend pour Bull         |
| **Bull Board** | 6.14.1   | Dashboard de monitoring des queues |

### API & HTTP

| Technologie    | Version | Rôle                           |
| -------------- | ------- | ------------------------------ |
| **Axios**      | 1.13.2  | Client HTTP pour API CoinGecko |
| **Bottleneck** | 2.19.5  | Rate limiting API calls        |

### Configuration & Scheduling

| Technologie          | Version | Rôle                        |
| -------------------- | ------- | --------------------------- |
| **@nestjs/config**   | 4.0.2   | Gestion de la configuration |
| **@nestjs/schedule** | 6.0.1   | Tâches planifiées (cron)    |
| **dotenv**           | 17.2.3  | Variables d'environnement   |

### Conteneurisation

| Technologie        | Version | Rôle                           |
| ------------------ | ------- | ------------------------------ |
| **Docker**         | -       | Conteneurisation               |
| **Docker Compose** | -       | Orchestration multi-containers |

---

## ✅ Fonctionnalités Implémentées

### 1. Service de Collecte (Collector)

#### 🔄 Collecte Automatique Périodique

- ⏰ **Fréquence**: Toutes les 5 minutes (configurable)
- 🎯 **Déclenchement**: Automatique au démarrage + périodique
- 🔁 **Retry**: 3 tentatives avec backoff exponentiel
- 📊 **Monitoring**: Dashboard Bull Board accessible sur http://localhost:3001/admin/queues

#### 🌐 Intégration API CoinGecko

- **Service**: `CoingeckoClientService`
- **Endpoint**: `/coins/markets`
- **Rate Limiting**: 2 secondes entre chaque requête (~30 req/min)
- **Données récupérées**:
  - Prix actuel (EUR)
  - Prix max/min 24h
  - Variation de prix (1h, 24h)
  - Capitalisation de marché
  - Volume total
  - Supply (circulant, total, max)
  - All-Time High/Low (ATH/ATL)
  - Rank de capitalisation

#### 🔄 Pipeline de Traitement

```
CoinGecko API → CoingeckoClient → DataTransformer → Storage → PostgreSQL
```

**Services impliqués**:

1. **CoingeckoClientService**: Appels API avec rate limiting
2. **DataTransformerService**: Transformation format API → format BDD
3. **StorageService**: Upsert crypto + sauvegarde market data

#### 📋 Queue Bull

- **Queue Name**: `market-data-collection`
- **Job Type**: `collect`
- **Features**:
  - Retry automatique (3 tentatives)
  - Backoff exponentiel (5s initial)
  - Logs détaillés (active, completed, failed)

### 2. Base de Données PostgreSQL

#### 📊 Modèle de Données

**Cryptocurrency** (Table: `cryptocurrencies`)

- Informations statiques des cryptomonnaies
- Upsert basé sur `coingeckoId` (unique)
- Index sur `symbol`, `marketCapRank`, `coingeckoId`

**MarketData** (Table: `market_data`)

- Données de marché horodatées
- Relation 1-N avec Cryptocurrency
- Contrainte unique: `[cryptocurrencyId, timestamp]`
- Index optimisés pour requêtes temporelles

#### 🗄️ Prisma ORM

- Génération automatique du client
- Migrations versionnées
- Type-safety complet

### 3. Infrastructure Docker

#### 🐳 Services Docker Compose

```yaml
Services:
  - postgres:5432 # Base de données
  - redis:6379 # Queue backend
  - pgadmin:5050 # Interface BDD
```

#### 📦 Volumes Persistants

- `postgres_data`: Données PostgreSQL
- `redis_data`: Données Redis

#### 🌐 Network

- `crypto_network`: Bridge network pour inter-communication

### 4. Configuration Centralisée

#### 📝 Variables d'Environnement (.env)

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/crypto_platform

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# CoinGecko API
COINGECKO_API_URL=https://api.coingecko.com/api/v3
COINGECKO_RATE_LIMIT_MS=2000

# Collector Configuration
COLLECTOR_CRYPTO_IDS=bitcoin,ethereum,solana
COLLECTOR_INTERVAL_MINUTES=5

# Bull Board
BULL_BOARD_PORT=3001
```

#### ⚙️ Configuration Module

- **Fichier**: `collector.config.ts`
- **Type-safe**: Configuration typée TypeScript
- **Valeurs par défaut**: Fallbacks définis

---

## 📊 Structure des Données

### Schéma Base de Données (Prisma)

#### Table: `cryptocurrencies`

| Colonne         | Type         | Description             |
| --------------- | ------------ | ----------------------- |
| id              | UUID         | Identifiant unique      |
| coingecko_id    | VARCHAR(50)  | ID CoinGecko (unique)   |
| symbol          | VARCHAR(10)  | Symbole (BTC, ETH, SOL) |
| name            | VARCHAR(100) | Nom complet             |
| image           | TEXT         | URL de l'image          |
| market_cap_rank | INT          | Rang de capitalisation  |
| is_active       | BOOLEAN      | Actif/Inactif           |
| created_at      | TIMESTAMP    | Date de création        |
| updated_at      | TIMESTAMP    | Date de mise à jour     |

**Index**:

- `symbol` (index)
- `market_cap_rank` (index)
- `coingecko_id` (index unique)

#### Table: `market_data`

| Colonne                     | Type          | Description                  |
| --------------------------- | ------------- | ---------------------------- |
| id                          | UUID          | Identifiant unique           |
| cryptocurrency_id           | UUID          | FK vers cryptocurrencies     |
| current_price               | DECIMAL(20,8) | Prix actuel (EUR)            |
| high_24h                    | DECIMAL(20,8) | Plus haut 24h                |
| low_24h                     | DECIMAL(20,8) | Plus bas 24h                 |
| price_change_24h            | DECIMAL(20,8) | Changement de prix 24h       |
| price_change_percentage_24h | DECIMAL(10,4) | % changement 24h             |
| price_change_percentage_1h  | DECIMAL(10,4) | % changement 1h              |
| market_cap                  | DECIMAL(22,2) | Capitalisation               |
| fully_diluted_valuation     | DECIMAL(22,2) | Valuation entièrement diluée |
| total_volume                | DECIMAL(22,2) | Volume total                 |
| circulating_supply          | DECIMAL(20,2) | Supply circulant             |
| total_supply                | DECIMAL(20,2) | Supply total                 |
| max_supply                  | DECIMAL(20,2) | Supply maximum               |
| ath                         | DECIMAL(20,8) | All-Time High                |
| ath_date                    | TIMESTAMP     | Date ATH                     |
| atl                         | DECIMAL(20,8) | All-Time Low                 |
| atl_date                    | TIMESTAMP     | Date ATL                     |
| timestamp                   | TIMESTAMP     | Horodatage des données       |
| created_at                  | TIMESTAMP     | Date d'enregistrement        |

**Index**:

- `cryptocurrency_id` (index)
- `timestamp` DESC (index)
- `[cryptocurrency_id, timestamp]` DESC (composite)

**Contraintes**:

- Unique: `[cryptocurrency_id, timestamp]`
- Foreign Key: `cryptocurrency_id` → `cryptocurrencies.id` (ON DELETE CASCADE)

---

## 🚀 Configuration et Déploiement

### Prérequis

- **Node.js**: v18+ recommandé
- **npm**: v9+
- **Docker**: v20+
- **Docker Compose**: v2+

### Installation

```bash
# 1. Cloner le repository
git clone <repository-url>
cd crypto-collector-platform

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos configurations

# 4. Démarrer l'infrastructure Docker
docker-compose up -d

# 5. Générer le client Prisma
npx prisma generate

# 6. Exécuter les migrations
npx prisma migrate deploy
```

### Démarrage des Applications

```bash
# Démarrer le Collector en mode développement
npm run start:dev collector

# Démarrer l'API en mode développement
npm run start:dev api

# Build production
npm run build

# Démarrer en production
npm run start:prod
```

### Accès aux Services

| Service        | URL                                | Credentials                                                               |
| -------------- | ---------------------------------- | ------------------------------------------------------------------------- |
| **Bull Board** | http://localhost:3001/admin/queues | -                                                                         |
| **PgAdmin**    | http://localhost:5050              | Email: rzaki@hotmail.fr<br>Password: admin                                |
| **PostgreSQL** | localhost:5432                     | User: crypto_user<br>Password: crypto_password_dev<br>DB: crypto_platform |
| **Redis**      | localhost:6379                     | -                                                                         |

---

## 📈 État Actuel du Projet

### ✅ Fonctionnalités Complètes

- ✅ Architecture monorepo NestJS configurée
- ✅ Service de collecte automatique (Collector)
- ✅ Intégration API CoinGecko avec rate limiting
- ✅ Système de queues Bull + Redis
- ✅ Dashboard Bull Board pour monitoring
- ✅ Base de données PostgreSQL avec Prisma
- ✅ Modèles de données complets
- ✅ Migrations de base de données
- ✅ Configuration centralisée
- ✅ Infrastructure Docker complète
- ✅ Logs structurés et détaillés

### 🚧 En Cours / À Finaliser

- ⚠️ **API REST** (structure créée, endpoints à implémenter)
  - GET /cryptocurrencies (liste)
  - GET /cryptocurrencies/:id (détail)
  - GET /cryptocurrencies/:id/market-data (historique)
  - GET /market-data (avec filtres)
- ⚠️ **Tests** (structure créée, tests à écrire)
  - Tests unitaires des services
  - Tests d'intégration
  - Tests E2E

### 📊 Statistiques du Code

```
Applications:       2 (collector, api)
Librairies:         2 (common, database)
Services:           5+
Modules:            4+
Lignes de code:     ~1000+ (estimation)
```

### 🔧 Configuration Actuelle

```yaml
Collecte:
  Fréquence: 5 minutes
  Cryptos: Bitcoin, Ethereum, Solana
  Rate Limit: 2 secondes/requête
  Retry: 3 tentatives

Base de Données:
  Engine: PostgreSQL 15
  ORM: Prisma 6.19.0

Queue:
  Engine: Bull + Redis
  Queue: market-data-collection
```

---

## 🗺️ Roadmap & Améliorations Futures

### Phase 1: Complétion Core (Court Terme)

#### 1.1 API REST Complète

- [ ] Implémenter les endpoints CRUD
- [ ] Documentation Swagger/OpenAPI
- [ ] Pagination et filtres avancés
- [ ] Validation des entrées (class-validator)
- [ ] Gestion des erreurs standardisée

#### 1.2 Tests

- [ ] Tests unitaires (>80% coverage)
- [ ] Tests d'intégration
- [ ] Tests E2E
- [ ] Tests de charge

### Phase 2: Fonctionnalités Avancées (Moyen Terme)

#### 2.1 Données Enrichies

- [ ] Support de plus de cryptomonnaies (top 50, 100)
- [ ] Données OHLCV (Open, High, Low, Close, Volume)
- [ ] Données de trading en temps réel
- [ ] Sentiment du marché
- [ ] Données on-chain

#### 2.2 Analytics & Agrégation

- [ ] Calcul d'indicateurs techniques (RSI, MACD, etc.)
- [ ] Agrégations temporelles (1h, 4h, 1d, 1w)
- [ ] Détection de tendances
- [ ] Corrélations entre cryptos

#### 2.3 Système d'Alertes

- [ ] Alertes par email
- [ ] Alertes push (Firebase, OneSignal)
- [ ] Alertes Webhook
- [ ] Conditions personnalisables
  - Seuils de prix
  - Variations % (1h, 24h, 7d)
  - Volume anormal
  - Nouveaux ATH/ATL

### Phase 3: Scalabilité & Performance (Long Terme)

#### 3.1 Optimisations

- [ ] Cache Redis pour API
- [ ] Compression des données historiques
- [ ] Partitionnement de tables (TimescaleDB)
- [ ] Index optimisés pour requêtes complexes
- [ ] WebSockets pour données temps réel

#### 3.2 Monitoring & Observabilité

- [ ] Prometheus + Grafana
- [ ] Logs centralisés (ELK Stack)
- [ ] Tracing distribué (Jaeger)
- [ ] Health checks avancés
- [ ] Métriques custom

#### 3.3 Sécurité

- [ ] Authentication JWT
- [ ] Authorization (RBAC)
- [ ] Rate limiting API
- [ ] Validation avancée
- [ ] Audit logs

### Phase 4: Frontend & Applications (Futur)

#### 4.1 Dashboard Web

- [ ] Interface React/Vue.js
- [ ] Graphiques interactifs (Chart.js, D3.js)
- [ ] Tableaux de bord personnalisables
- [ ] Watchlists
- [ ] Comparateur de cryptos

#### 4.2 Applications Mobiles

- [ ] App iOS (React Native / Flutter)
- [ ] App Android (React Native / Flutter)
- [ ] Notifications push
- [ ] Mode hors ligne

### Phase 5: Fonctionnalités Avancées (Vision)

- [ ] Trading Bot Framework
- [ ] Backtesting de stratégies
- [ ] Portfolio tracking
- [ ] Tax reporting
- [ ] Social features (partage d'analyses)
- [ ] AI/ML pour prédictions

---

## 📚 Ressources & Références

### Documentation Officielle

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Bull Queue](https://github.com/OptimalBits/bull)
- [CoinGecko API](https://www.coingecko.com/en/api/documentation)

### Architecture & Best Practices

- [NestJS Monorepo](https://docs.nestjs.com/cli/monorepo)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [Bull Best Practices](https://github.com/OptimalBits/bull/blob/master/PATTERNS.md)

### Outils Utiles

- **Bull Board**: http://localhost:3001/admin/queues
- **PgAdmin**: http://localhost:5050
- **Prisma Studio**: `npx prisma studio`

---

## 👥 Contributeurs

- **Zakaria Reguieg** - Développeur Principal

---

## 📄 License

UNLICENSED - Projet privé

---

## 📞 Support & Contact

Pour toute question ou suggestion :

- Email: rzaki@hotmail.fr
- GitHub: [Zvki1/crypto-collector-platform](https://github.com/Zvki1/crypto-collector-platform)

---

**Dernière mise à jour**: 22 novembre 2025
