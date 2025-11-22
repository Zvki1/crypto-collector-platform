# 📐 Diagrammes d'Architecture - Crypto Collector Platform

> Représentations visuelles de l'architecture du projet

---

## 📊 Vue d'Ensemble du Système

```
┌──────────────────────────────────────────────────────────────────┐
│                     CRYPTO COLLECTOR PLATFORM                     │
└──────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┴───────────────┐
                │                               │
        ┌───────▼────────┐              ┌──────▼───────┐
        │   COLLECTOR    │              │     API      │
        │    :3001       │              │    :3000     │
        │                │              │              │
        │ • Scheduler    │              │ • REST       │
        │ • Bull Queue   │              │ • GraphQL    │
        │ • CoinGecko    │              │ • Swagger    │
        └────────┬───────┘              └──────┬───────┘
                 │                              │
                 └──────────┬───────────────────┘
                            │
                   ┌────────▼────────┐
                   │   SHARED LIBS   │
                   │                 │
                   │ • Database      │
                   │ • Common        │
                   └────────┬────────┘
                            │
              ┌─────────────┴─────────────┐
              │                           │
     ┌────────▼────────┐       ┌─────────▼────────┐
     │   PostgreSQL    │       │      Redis       │
     │     :5432       │       │      :6379       │
     │                 │       │                  │
     │ • Cryptocurrencies     │ • Bull Queues    │
     │ • MarketData    │       │ • Cache          │
     └─────────────────┘       └──────────────────┘
```

---

## 🔄 Flow de Collecte des Données

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CYCLE DE COLLECTE (5 minutes)                    │
└─────────────────────────────────────────────────────────────────────┘

    ⏰ DÉCLENCHEUR
         │
         ▼
┌────────────────────┐
│ CollectorScheduler │  setInterval(5 min)
└────────┬───────────┘
         │ collectionQueue.add('collect')
         ▼
┌────────────────────┐
│   Redis Queue      │  Job: { type: 'collect', data: {} }
│   (Bull)           │
└────────┬───────────┘
         │
         ▼
┌────────────────────────┐
│ MarketDataCollectorJob │  @Process('collect')
└───────┬────────────────┘
        │
        ├──► 1. CoingeckoClientService.fetchMarketData()
        │           │
        │           ▼
        │    ┌──────────────────┐
        │    │ CoinGecko API    │  GET /coins/markets
        │    │                  │  params: { ids: 'bitcoin,ethereum,solana' }
        │    └────────┬─────────┘
        │             │ Response: JSON[]
        │             ▼
        │
        ├──► 2. DataTransformer.transformToCryptocurrency()
        │           │ Map API → Crypto Entity
        │           ▼
        │
        ├──► 3. StorageService.upsertCryptocurrency()
        │           │ Prisma: UPSERT
        │           ▼
        │    ┌──────────────────┐
        │    │   PostgreSQL     │  Table: cryptocurrencies
        │    │                  │  Action: INSERT or UPDATE
        │    └────────┬─────────┘
        │             │ Crypto { id, ... }
        │             ▼
        │
        ├──► 4. DataTransformer.transformToMarketData()
        │           │ Map API → MarketData Entity
        │           ▼
        │
        └──► 5. StorageService.saveMarketData()
                    │ Prisma: INSERT
                    ▼
             ┌──────────────────┐
             │   PostgreSQL     │  Table: market_data
             │                  │  Action: INSERT
             └────────┬─────────┘
                      │
                      ▼
                ✅ COLLECTE TERMINÉE
                      │
                      │ Attendre 5 minutes...
                      │
                      └──────► ⏰ (recommence)
```

---

## 🏗️ Architecture Monorepo

```
crypto-collector-platform/
│
├─── 📱 APPLICATIONS (apps/)
│    │
│    ├─── collector/
│    │    ├── src/
│    │    │   ├── main.ts                    ← Entry point
│    │    │   ├── collector.module.ts        ← Module principal
│    │    │   ├── collector.scheduler.ts     ← Planificateur
│    │    │   │
│    │    │   ├── config/
│    │    │   │   └── collector.config.ts    ← Configuration
│    │    │   │
│    │    │   ├── jobs/
│    │    │   │   └── market-data-collector.job.ts  ← Bull Job
│    │    │   │
│    │    │   ├── services/
│    │    │   │   ├── coingecko-client.service.ts   ← API Client
│    │    │   │   ├── data-transformer.service.ts   ← Transformation
│    │    │   │   └── storage.service.ts            ← Persistence
│    │    │   │
│    │    │   └── health/
│    │    │       └── health.controller.ts   ← Health check
│    │    │
│    │    └── types/
│    │        └── coinGeckoMarketData.ts     ← Types API
│    │
│    └─── api/
│         └── src/
│             ├── main.ts
│             ├── api.module.ts
│             ├── api.controller.ts
│             └── api.service.ts
│
├─── 📚 LIBRAIRIES PARTAGÉES (libs/)
│    │
│    ├─── database/
│    │    └── src/
│    │        ├── database.module.ts         ← Module Prisma
│    │        └── database.service.ts        ← Service Prisma
│    │
│    └─── common/
│         └── src/
│             ├── common.module.ts
│             └── common.service.ts
│
├─── 🗄️ BASE DE DONNÉES (prisma/)
│    ├── schema.prisma                       ← Schéma BDD
│    └── migrations/
│        └── 20251111191959_init/
│            └── migration.sql
│
└─── 🐳 INFRASTRUCTURE (docker/)
     └── docker-compose.yml
```

---

## 🔌 Injection de Dépendances

```
┌────────────────────────────────────────────────────┐
│              CollectorModule                        │
│                                                     │
│  Imports:                                          │
│  ├─ ConfigModule         (config)                 │
│  ├─ DatabaseModule       (@app/database)          │
│  ├─ BullModule           (queues)                 │
│  └─ ScheduleModule       (cron)                   │
│                                                     │
│  Providers:                                        │
│  ├─ CoingeckoClientService ──┐                    │
│  ├─ DataTransformerService ───┤                   │
│  ├─ StorageService ───────────┤                   │
│  ├─ MarketDataCollectorJob ◄──┤ (injection)       │
│  └─ CollectorScheduler ◄──────┘                   │
└────────────────────────────────────────────────────┘
                     │
                     │ Utilise
                     ▼
┌────────────────────────────────────────────────────┐
│           MarketDataCollectorJob                   │
│                                                     │
│  constructor(                                      │
│    private coingeckoClient: CoingeckoClientService,│ ◄── Injecté
│    private dataTransformer: DataTransformerService,│ ◄── Injecté
│    private storage: StorageService,                │ ◄── Injecté
│    private configService: ConfigService            │ ◄── Injecté
│  ) {}                                              │
└────────────────────────────────────────────────────┘
```

---

## 📊 Modèle de Données (Relations)

```
┌─────────────────────────────────────────┐
│         Cryptocurrency                   │
├─────────────────────────────────────────┤
│ PK  id: UUID                            │
│ UQ  coingeckoId: String                 │
│     symbol: String                       │
│     name: String                         │
│     image: String?                       │
│     marketCapRank: Int?                  │
│     isActive: Boolean                    │
│     createdAt: DateTime                  │
│     updatedAt: DateTime                  │
└─────────────┬───────────────────────────┘
              │
              │ 1
              │
              │ has many
              │
              │ N
              ▼
┌─────────────────────────────────────────┐
│           MarketData                     │
├─────────────────────────────────────────┤
│ PK  id: UUID                            │
│ FK  cryptocurrencyId: UUID              │ ◄── Foreign Key
│     currentPrice: Decimal                │
│     high24h: Decimal?                    │
│     low24h: Decimal?                     │
│     priceChange24h: Decimal?             │
│     priceChangePercentage24h: Decimal?   │
│     priceChangePercentage1h: Decimal?    │
│     marketCap: Decimal?                  │
│     totalVolume: Decimal?                │
│     circulatingSupply: Decimal?          │
│     totalSupply: Decimal?                │
│     maxSupply: Decimal?                  │
│     ath: Decimal?                        │
│     athDate: DateTime?                   │
│     atl: Decimal?                        │
│     atlDate: DateTime?                   │
│ ⚡  timestamp: DateTime                  │ ◄── Index
│     createdAt: DateTime                  │
├─────────────────────────────────────────┤
│ UNIQUE (cryptocurrencyId, timestamp)    │
│ INDEX (cryptocurrencyId)                │
│ INDEX (timestamp DESC)                  │
└─────────────────────────────────────────┘
```

---

## 🔄 Cycle de Vie d'une Requête API (Futur)

```
     CLIENT
        │
        │ HTTP GET /api/cryptocurrencies/bitcoin/market-data
        │       ?from=2025-01-01&to=2025-01-31
        ▼
┌─────────────────┐
│  API Module     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Controller      │  @Get(':id/market-data')
└────────┬────────┘
         │
         │ Validation (query params)
         ▼
┌─────────────────┐
│ Service         │  getMarketData(id, from, to)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ DatabaseService │  prisma.marketData.findMany()
│  (Prisma)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  PostgreSQL     │  SELECT * FROM market_data
│                 │  WHERE cryptocurrency_id = '...'
│                 │  AND timestamp BETWEEN '...' AND '...'
└────────┬────────┘
         │
         │ Résultat: MarketData[]
         ▼
┌─────────────────┐
│ Transformer     │  Format pour le client
└────────┬────────┘
         │
         │ JSON Response
         ▼
     CLIENT
```

---

## 🐳 Architecture Docker

```
┌────────────────────────────────────────────────────────────┐
│                    Docker Host                              │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │            Network: crypto_network (bridge)           │ │
│  │                                                        │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │ │
│  │  │ PostgreSQL   │  │    Redis     │  │  PgAdmin   │ │ │
│  │  │  Container   │  │  Container   │  │ Container  │ │ │
│  │  │              │  │              │  │            │ │ │
│  │  │ Port: 5432   │  │ Port: 6379   │  │ Port: 5050 │ │ │
│  │  │              │  │              │  │            │ │ │
│  │  │ Volume:      │  │ Volume:      │  │            │ │ │
│  │  │ postgres_data│  │ redis_data   │  │            │ │ │
│  │  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘ │ │
│  │         │                 │                 │        │ │
│  └─────────┼─────────────────┼─────────────────┼────────┘ │
│            │                 │                 │          │
└────────────┼─────────────────┼─────────────────┼──────────┘
             │                 │                 │
         localhost:          localhost:      localhost:
           5432                6379            5050
             │                 │                 │
             └─────────┬───────┴─────────────────┘
                       │
              ┌────────▼────────┐
              │   Applications  │
              │   (Host/Local)  │
              │                 │
              │ • Collector     │
              │ • API           │
              └─────────────────┘
```

---

## 🔐 Configuration & Environment

```
┌─────────────────────────────────────────────────────┐
│                    .env File                         │
├─────────────────────────────────────────────────────┤
│ DATABASE_URL=postgresql://...                       │
│ REDIS_HOST=localhost                                │
│ REDIS_PORT=6379                                     │
│ COINGECKO_API_URL=https://api.coingecko.com/...    │
│ COINGECKO_RATE_LIMIT_MS=2000                        │
│ COLLECTOR_CRYPTO_IDS=bitcoin,ethereum,solana        │
│ COLLECTOR_INTERVAL_MINUTES=5                        │
│ BULL_BOARD_PORT=3001                                │
└────────────────────┬────────────────────────────────┘
                     │
                     │ Chargé par
                     ▼
┌─────────────────────────────────────────────────────┐
│         ConfigModule (NestJS)                       │
├─────────────────────────────────────────────────────┤
│  ConfigService                                      │
│    ├─ get('DATABASE_URL')                          │
│    ├─ get('collector.intervalMinutes')             │
│    └─ get('collector.cryptoIds')                   │
└────────────────────┬────────────────────────────────┘
                     │
                     │ Injecté dans
                     ▼
┌─────────────────────────────────────────────────────┐
│              Application Services                    │
│                                                      │
│  • CollectorScheduler                               │
│  • CoingeckoClientService                          │
│  • DatabaseService                                  │
└─────────────────────────────────────────────────────┘
```

---

## ⚡ Bull Queue System

```
┌──────────────────────────────────────────────────────────┐
│                  SCHEDULER                                │
│  (CollectorScheduler)                                    │
│                                                           │
│  setInterval(5 minutes) ──┐                              │
│  onModuleInit() ──────────┤                              │
└────────────────────────────┼──────────────────────────────┘
                             │
                             │ queue.add('collect', data)
                             ▼
┌──────────────────────────────────────────────────────────┐
│                  REDIS (Queue Storage)                    │
│                                                           │
│  Queue: "market-data-collection"                         │
│    ├─ Waiting: [job1, job2, ...]                        │
│    ├─ Active: [job3]                                     │
│    ├─ Completed: [job4, job5, ...]                      │
│    └─ Failed: [job6]                                     │
└────────────────────────┬─────────────────────────────────┘
                         │
                         │ Job picked
                         ▼
┌──────────────────────────────────────────────────────────┐
│              JOB PROCESSOR                                │
│  (MarketDataCollectorJob)                                │
│                                                           │
│  @Process('collect')                                     │
│  async collectMarketData(job: Job) {                     │
│    // Fetch, Transform, Store                           │
│  }                                                        │
│                                                           │
│  Hooks:                                                  │
│  ├─ @OnQueueActive()   ──► Log start                    │
│  ├─ @OnQueueCompleted() ──► Log success                 │
│  └─ @OnQueueFailed()    ──► Log error + retry           │
└──────────────────────────────────────────────────────────┘
                         │
                         │ Job result
                         ▼
                  ┌──────────────┐
                  │ Bull Board   │  Monitoring
                  │ Dashboard    │  http://localhost:3001/admin/queues
                  └──────────────┘
```

---

## 🔍 Rate Limiting (Bottleneck)

```
┌─────────────────────────────────────────────────┐
│      CoinGecko API Rate Limits                   │
│      Free Tier: ~30 calls/minute                │
└────────────────┬────────────────────────────────┘
                 │
                 │ Protection via Bottleneck
                 ▼
┌─────────────────────────────────────────────────┐
│     CoingeckoClientService                       │
│                                                  │
│  limiter = new Bottleneck({                     │
│    minTime: 2000,        ← 2 secondes minimum  │
│    maxConcurrent: 1      ← 1 requête à la fois │
│  })                                             │
│                                                  │
│  async fetchMarketData() {                      │
│    return limiter.schedule(() =>                │
│      axios.get(...)      ← Requête limitée     │
│    )                                            │
│  }                                              │
└─────────────────────────────────────────────────┘

Timeline:
───────────────────────────────────────────────────►
  │      2s      │      2s      │      2s      │
  ▼              ▼              ▼              ▼
Req 1          Req 2          Req 3          Req 4
  ✓              ✓              ✓              ✓
```

---

## 📈 Monitoring Stack

```
┌────────────────────────────────────────────────────┐
│              BULL BOARD DASHBOARD                   │
│        http://localhost:3001/admin/queues          │
│                                                     │
│  📊 Queues:                                        │
│    └─ market-data-collection                       │
│       ├─ Active: 0                                 │
│       ├─ Waiting: 0                                │
│       ├─ Completed: 127                            │
│       ├─ Failed: 3                                 │
│       └─ Paused: false                             │
│                                                     │
│  📈 Stats:                                         │
│    ├─ Throughput: 1 job/5min                      │
│    ├─ Success Rate: 97.7%                         │
│    └─ Avg Duration: 2.3s                          │
└────────────────────────────────────────────────────┘
                     │
                     │ Visualize
                     ▼
┌────────────────────────────────────────────────────┐
│                REDIS QUEUE                          │
│                                                     │
│  Key: bull:market-data-collection:*                │
│    ├─ :id (job data)                              │
│    ├─ :completed                                   │
│    ├─ :failed                                      │
│    └─ :active                                      │
└────────────────────────────────────────────────────┘
```

---

**Note**: Ces diagrammes sont des représentations ASCII pour une compréhension rapide.
Pour des diagrammes plus détaillés, utilisez des outils comme draw.io, Lucidchart ou PlantUML.

---

_Dernière mise à jour : 22 novembre 2025_
