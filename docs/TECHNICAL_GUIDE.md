# 🔧 Guide Technique - Crypto Collector Platform

> Guide technique détaillé pour les développeurs travaillant sur le projet

---

## 📋 Table des Matières

1. [Démarrage Rapide](#démarrage-rapide)
2. [Architecture NestJS](#architecture-nestjs)
3. [Flow de Données](#flow-de-données)
4. [Composants Détaillés](#composants-détaillés)
5. [Base de Données](#base-de-données)
6. [API CoinGecko](#api-coingecko)
7. [Debugging & Troubleshooting](#debugging--troubleshooting)
8. [Conventions de Code](#conventions-de-code)

---

## 🚀 Démarrage Rapide

### Setup Initial

```bash
# 1. Installation des dépendances
npm install

# 2. Démarrer l'infrastructure
docker-compose up -d

# 3. Configuration Prisma
npx prisma generate
npx prisma migrate deploy

# 4. Vérifier les services
docker ps
# Vous devriez voir: postgres, redis, pgadmin

# 5. Démarrer le Collector
npm run start:dev collector

# 6. Vérifier les logs
# ✅ Collector is running and will collect data periodically
# 📋 Bull Board dashboard available at: http://localhost:3001/admin/queues
```

### Commandes Utiles

```bash
# Développement
npm run start:dev collector    # Collector avec hot-reload
npm run start:dev api          # API avec hot-reload

# Build & Production
npm run build                  # Build toutes les apps
npm run start:prod            # Start en production

# Base de données
npx prisma studio             # Interface graphique BDD
npx prisma migrate dev        # Créer une nouvelle migration
npx prisma db seed            # Seeder (à créer)

# Tests
npm run test                  # Tests unitaires
npm run test:e2e             # Tests E2E
npm run test:cov             # Coverage

# Linting & Formatting
npm run lint                  # ESLint
npm run format                # Prettier

# Docker
docker-compose up -d          # Démarrer tous les services
docker-compose down           # Arrêter tous les services
docker-compose logs -f        # Voir les logs
docker-compose ps             # Status des containers
```

---

## 🏛️ Architecture NestJS

### Structure Monorepo

Le projet utilise une architecture **monorepo** NestJS qui permet de :

- Partager du code entre applications
- Gérer plusieurs applications dans un seul repository
- Maintenir une cohérence de configuration

```
apps/          # Applications indépendantes (peuvent être déployées séparément)
├── collector  # Service de collecte (background job)
└── api        # API REST (exposée publiquement)

libs/          # Librairies partagées (DRY principle)
├── common     # Services/utils communs à toutes les apps
└── database   # Module de base de données (Prisma)
```

### Concepts NestJS Clés

#### 1. **Modules** (`@Module`)

Les modules encapsulent la logique métier et les dépendances :

```typescript
@Module({
  imports: [
    ConfigModule.forRoot(), // Configuration globale
    DatabaseModule, // Module de BDD partagé
    BullModule.forRoot(), // Configuration Bull Queue
  ],
  controllers: [HealthController],
  providers: [
    CoingeckoClientService,
    DataTransformerService,
    StorageService,
    MarketDataCollectorJob,
    CollectorScheduler,
  ],
})
export class CollectorModule {}
```

**Points clés** :

- `imports`: Modules dont ce module dépend
- `controllers`: Contrôleurs HTTP de ce module
- `providers`: Services injectables (singletons)
- `exports`: Services exposés aux autres modules

#### 2. **Providers & Dependency Injection**

NestJS utilise l'injection de dépendances (IoC - Inversion of Control) :

```typescript
@Injectable()
export class CoingeckoClientService {
  constructor(
    private configService: ConfigService, // ← Injection automatique
  ) {
    // ConfigService est injecté automatiquement par NestJS
    this.apiUrl = this.configService.get('collector.coingecko.apiUrl');
  }
}
```

**Avantages** :

- Testabilité (facile de mocker)
- Découplage du code
- Gestion automatique du cycle de vie

#### 3. **Decorators**

Les decorators ajoutent des métadonnées aux classes/méthodes :

```typescript
@Injectable()              // Marque la classe comme injectable
@Module()                  // Définit un module
@Controller('api')         // Définit un contrôleur HTTP
@Get()                     // Route HTTP GET
@Process('collect')        // Processeur de job Bull
@OnModuleInit()            // Lifecycle hook
```

---

## 🔄 Flow de Données

### Flow Complet de Collecte

```
1. DÉCLENCHEMENT
   ├─ OnModuleInit (au démarrage)
   └─ setInterval (toutes les 5 minutes)
          │
          ▼
2. SCHEDULER (collector.scheduler.ts)
   └─ collectionQueue.add('collect', {})  ← Ajoute job à la queue
          │
          ▼
3. REDIS (queue storage)
   └─ Job en attente dans Bull Queue
          │
          ▼
4. JOB PROCESSOR (market-data-collector.job.ts)
   │
   ├─ @Process('collect')  ← Traite le job
   │   │
   │   ├─ 4.1: CoingeckoClient.fetchMarketData()
   │   │        └─ Axios GET avec rate limiting
   │   │                │
   │   │                ▼
   │   │        API CoinGecko Response (JSON)
   │   │
   │   ├─ 4.2: DataTransformer.transformToCryptocurrency()
   │   │        └─ Map API data → Prisma model
   │   │
   │   ├─ 4.3: Storage.upsertCryptocurrency()
   │   │        └─ Prisma: INSERT ... ON CONFLICT UPDATE
   │   │
   │   ├─ 4.4: DataTransformer.transformToMarketData()
   │   │        └─ Map API data → Prisma model
   │   │
   │   └─ 4.5: Storage.saveMarketData()
   │            └─ Prisma: INSERT market_data
   │
   └─ @OnQueueCompleted() ← Log success
          │
          ▼
5. POSTGRESQL (données persistées)
   ├─ Table: cryptocurrencies (upserted)
   └─ Table: market_data (nouvelle entrée)
```

### Diagramme de Séquence

```mermaid
sequenceDiagram
    participant S as Scheduler
    participant Q as Bull Queue
    participant J as Job Processor
    participant C as CoinGecko API
    participant T as Transformer
    participant D as Database

    S->>Q: Add job 'collect'
    Q->>J: Process job
    J->>C: GET /coins/markets
    C-->>J: Market data (JSON)
    J->>T: Transform to Crypto entity
    T-->>J: Crypto entity
    J->>D: Upsert cryptocurrency
    J->>T: Transform to MarketData entity
    T-->>J: MarketData entity
    J->>D: Insert market_data
    D-->>J: Success
    J-->>Q: Job completed
```

---

## 🧩 Composants Détaillés

### 1. Collector Scheduler

**Fichier**: `apps/collector/src/collector.scheduler.ts`

**Responsabilité**: Planifier la collecte périodique

```typescript
@Injectable()
export class CollectorScheduler implements OnModuleInit, OnModuleDestroy {
  private intervalId?: NodeJS.Timeout;

  constructor(
    @InjectQueue('market-data-collection') private collectionQueue: Queue,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    // 1. Collecte initiale au démarrage
    await this.collectionQueue.add('collect', {}, { attempts: 3 });

    // 2. Démarrer la collecte périodique
    this.startPeriodicCollection();
  }

  private startPeriodicCollection() {
    const intervalMinutes = this.configService.get(
      'collector.intervalMinutes',
      5,
    );
    const intervalMs = intervalMinutes * 60 * 1000;

    this.intervalId = setInterval(() => {
      this.scheduleCollection();
    }, intervalMs);
  }

  onModuleDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}
```

**Lifecycle Hooks** :

- `OnModuleInit`: Exécuté une fois que toutes les dépendances sont injectées
- `OnModuleDestroy`: Exécuté avant la fermeture de l'application

### 2. Market Data Collector Job

**Fichier**: `apps/collector/src/jobs/market-data-collector.job.ts`

**Responsabilité**: Traiter les jobs de collecte

```typescript
@Processor('market-data-collection') // ← Nom de la queue
export class MarketDataCollectorJob {
  @Process('collect') // ← Nom du job
  async collectMarketData(job: Job) {
    const cryptoIds = this.configService.get<string[]>('collector.cryptoIds');

    // 1. Fetch depuis CoinGecko
    const marketDataList =
      await this.coingeckoClient.fetchMarketData(cryptoIds);

    // 2. Traiter chaque crypto
    for (const apiData of marketDataList) {
      // 2.1 Upsert crypto
      const cryptoEntity =
        this.dataTransformer.transformToCryptocurrency(apiData);
      const crypto = await this.storage.upsertCryptocurrency(cryptoEntity);

      // 2.2 Sauvegarder market data
      const marketDataEntity = this.dataTransformer.transformToMarketData(
        apiData,
        crypto.id,
      );
      await this.storage.saveMarketData(marketDataEntity);
    }

    return { success: true, processed: marketDataList.length };
  }

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.log(`Processing job ${job.id}`);
  }

  @OnQueueCompleted()
  onCompleted(job: Job, result: any) {
    this.logger.log(`Job ${job.id} completed!`);
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed!`);
  }
}
```

**Bull Decorators** :

- `@Processor(queueName)`: Définit un processeur de queue
- `@Process(jobName)`: Définit le handler d'un type de job
- `@OnQueueActive()`: Hook appelé quand un job démarre
- `@OnQueueCompleted()`: Hook appelé quand un job réussit
- `@OnQueueFailed()`: Hook appelé quand un job échoue

### 3. CoinGecko Client Service

**Fichier**: `apps/collector/src/services/coingecko-client.service.ts`

**Responsabilité**: Communiquer avec l'API CoinGecko

```typescript
@Injectable()
export class CoingeckoClientService {
  private readonly httpClient: AxiosInstance;
  private readonly limiter: Bottleneck;

  constructor(private configService: ConfigService) {
    // Configuration Axios
    this.httpClient = axios.create({
      baseURL: 'https://api.coingecko.com/api/v3',
      timeout: 10000,
    });

    // Rate Limiter: 2 secondes entre chaque requête
    this.limiter = new Bottleneck({
      minTime: 2000, // 2 secondes minimum entre requêtes
      maxConcurrent: 1, // 1 requête à la fois
    });
  }

  async fetchMarketData(cryptoIds: string[]): Promise<CoinGeckoMarketData[]> {
    const ids = cryptoIds.join(',');

    // Requête avec rate limiting
    const response = await this.limiter.schedule(() =>
      this.httpClient.get<CoinGeckoMarketData[]>('/coins/markets', {
        params: {
          vs_currency: 'eur',
          ids,
          order: 'market_cap_desc',
          sparkline: false,
          price_change_percentage: '1h,24h',
        },
      }),
    );

    return response.data;
  }
}
```

**Points importants** :

- **Bottleneck**: Limite le taux de requêtes (respecte les limites API)
- **Axios**: Client HTTP avec timeout et baseURL
- **Error handling**: Try/catch + logs

### 4. Data Transformer Service

**Fichier**: `apps/collector/src/services/data-transformer.service.ts`

**Responsabilité**: Transformer les données API → modèles Prisma

```typescript
@Injectable()
export class DataTransformerService {
  transformToCryptocurrency(apiData: CoinGeckoMarketData) {
    return {
      coingeckoId: apiData.id,
      symbol: apiData.symbol,
      name: apiData.name,
      image: apiData.image,
      marketCapRank: apiData.market_cap_rank,
      isActive: true,
    };
  }

  transformToMarketData(
    apiData: CoinGeckoMarketData,
    cryptocurrencyId: string,
  ) {
    return {
      cryptocurrencyId,
      currentPrice: apiData.current_price,
      high24h: apiData.high_24h,
      low24h: apiData.low_24h,
      priceChange24h: apiData.price_change_24h,
      priceChangePercentage24h: apiData.price_change_percentage_24h,
      priceChangePercentage1h: apiData.price_change_percentage_1h_in_currency,
      marketCap: apiData.market_cap,
      totalVolume: apiData.total_volume,
      circulatingSupply: apiData.circulating_supply,
      totalSupply: apiData.total_supply,
      maxSupply: apiData.max_supply,
      ath: apiData.ath,
      athDate: apiData.ath_date ? new Date(apiData.ath_date) : null,
      atl: apiData.atl,
      atlDate: apiData.atl_date ? new Date(apiData.atl_date) : null,
      timestamp: new Date(),
    };
  }
}
```

### 5. Storage Service

**Fichier**: `apps/collector/src/services/storage.service.ts`

**Responsabilité**: Persister les données dans PostgreSQL

```typescript
@Injectable()
export class StorageService {
  constructor(private databaseService: DatabaseService) {}

  async upsertCryptocurrency(data: any) {
    return this.databaseService.cryptocurrency.upsert({
      where: { coingeckoId: data.coingeckoId },
      update: {
        symbol: data.symbol,
        name: data.name,
        image: data.image,
        marketCapRank: data.marketCapRank,
        updatedAt: new Date(),
      },
      create: data,
    });
  }

  async saveMarketData(data: any) {
    return this.databaseService.marketData.create({
      data,
    });
  }
}
```

**Prisma Operations** :

- `upsert`: INSERT si n'existe pas, UPDATE sinon
- `create`: INSERT
- `findUnique`: SELECT avec condition unique
- `findMany`: SELECT avec filtres

---

## 🗄️ Base de Données

### Schéma Prisma

```prisma
model Cryptocurrency {
  id            String   @id @default(uuid()) @db.Uuid
  coingeckoId   String   @unique @map("coingecko_id")
  symbol        String
  name          String
  image         String?
  marketCapRank Int?     @map("market_cap_rank")
  isActive      Boolean  @default(true) @map("is_active")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  marketData MarketData[]

  @@index([symbol])
  @@index([coingeckoId])
  @@map("cryptocurrencies")
}

model MarketData {
  id                           String   @id @default(uuid())
  cryptocurrencyId             String   @map("cryptocurrency_id")
  currentPrice                 Decimal  @map("current_price")
  // ... autres champs
  timestamp                    DateTime
  createdAt                    DateTime @default(now())

  cryptocurrency Cryptocurrency @relation(fields: [cryptocurrencyId], references: [id], onDelete: Cascade)

  @@unique([cryptocurrencyId, timestamp])
  @@index([cryptocurrencyId])
  @@index([timestamp(sort: Desc)])
  @@map("market_data")
}
```

### Requêtes Utiles

```sql
-- Dernières données de marché pour Bitcoin
SELECT * FROM market_data md
JOIN cryptocurrencies c ON md.cryptocurrency_id = c.id
WHERE c.symbol = 'btc'
ORDER BY md.timestamp DESC
LIMIT 10;

-- Prix moyen sur 24h
SELECT
  c.symbol,
  AVG(md.current_price) as avg_price,
  MIN(md.current_price) as min_price,
  MAX(md.current_price) as max_price
FROM market_data md
JOIN cryptocurrencies c ON md.cryptocurrency_id = c.id
WHERE md.timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY c.symbol;

-- Volume total par crypto
SELECT
  c.name,
  SUM(md.total_volume) as total_volume
FROM market_data md
JOIN cryptocurrencies c ON md.cryptocurrency_id = c.id
GROUP BY c.name
ORDER BY total_volume DESC;
```

---

## 🌐 API CoinGecko

### Endpoint Utilisé

```
GET https://api.coingecko.com/api/v3/coins/markets
```

### Paramètres

```typescript
{
  vs_currency: 'eur',                        // Devise de référence
  ids: 'bitcoin,ethereum,solana',            // IDs des cryptos
  order: 'market_cap_desc',                  // Tri par capitalisation
  sparkline: false,                          // Pas de données graphiques
  price_change_percentage: '1h,24h',         // Variations 1h et 24h
}
```

### Réponse (exemple Bitcoin)

```json
[
  {
    "id": "bitcoin",
    "symbol": "btc",
    "name": "Bitcoin",
    "image": "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
    "current_price": 35420.5,
    "market_cap": 692385749203,
    "market_cap_rank": 1,
    "total_volume": 25837492847,
    "high_24h": 36250.0,
    "low_24h": 34890.0,
    "price_change_24h": 530.5,
    "price_change_percentage_24h": 1.52,
    "price_change_percentage_1h_in_currency": 0.35,
    "circulating_supply": 19554150.0,
    "total_supply": 21000000.0,
    "max_supply": 21000000.0,
    "ath": 69045.0,
    "ath_date": "2021-11-10T14:24:11.849Z",
    "atl": 67.81,
    "atl_date": "2013-07-06T00:00:00.000Z"
  }
]
```

### Rate Limits

- **Free tier**: 10-50 calls/min
- **Notre implémentation**: 2 secondes entre requêtes = ~30 calls/min

---

## 🐛 Debugging & Troubleshooting

### Problèmes Courants

#### 1. Collector ne collecte pas

```bash
# Vérifier les logs
docker-compose logs -f

# Vérifier le Bull Board
# http://localhost:3001/admin/queues
# - Jobs en "failed" ?
# - Erreurs dans les logs ?

# Vérifier Redis
docker exec -it crypto_redis redis-cli
> KEYS *
> GET bull:market-data-collection:*
```

#### 2. Erreur de connexion PostgreSQL

```bash
# Vérifier que PostgreSQL est démarré
docker ps | grep postgres

# Vérifier les credentials dans .env
DATABASE_URL=postgresql://crypto_user:crypto_password_dev@localhost:5432/crypto_platform

# Tester la connexion
npx prisma db pull
```

#### 3. Erreur API CoinGecko

```typescript
// Dans coingecko-client.service.ts, vérifier :
- Le rate limiting (peut-être trop rapide)
- L'URL de l'API
- Les crypto IDs (doivent correspondre aux IDs CoinGecko)
```

### Logs Utiles

```typescript
// Activer les logs détaillés
const app = await NestFactory.create(CollectorModule, {
  logger: ['log', 'error', 'warn', 'debug', 'verbose'], // ← Ajouter 'verbose'
});

// Dans les services
this.logger.log('Normal log');
this.logger.debug('Debug info'); // Seulement si debug activé
this.logger.warn('Warning');
this.logger.error('Error', error.stack);
```

---

## 📐 Conventions de Code

### Naming

```typescript
// Classes: PascalCase
export class CoingeckoClientService {}

// Fichiers: kebab-case
coingecko-client.service.ts

// Variables/functions: camelCase
const cryptoIds = ['bitcoin'];
async fetchMarketData() {}

// Constants: UPPER_SNAKE_CASE
const MAX_RETRIES = 3;

// Interfaces: PascalCase avec I prefix (optionnel)
interface ICoinGeckoResponse {}
```

### Structure de Fichier

```typescript
// 1. Imports (groupés et triés)
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

// 2. Decorator + Class
@Injectable()
export class MyService {
  // 3. Properties (private readonly preferred)
  private readonly logger = new Logger(MyService.name);
  private readonly httpClient: AxiosInstance;

  // 4. Constructor
  constructor(private configService: ConfigService) {}

  // 5. Public methods
  async publicMethod() {}

  // 6. Private methods
  private privateHelper() {}
}
```

### Error Handling

```typescript
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  const errorStack = error instanceof Error ? error.stack : undefined;

  this.logger.error(`Operation failed: ${errorMessage}`, errorStack);

  // Re-throw ou gérer selon le contexte
  throw new InternalServerErrorException('Failed to process data');
}
```

---

## 🔍 Monitoring & Observabilité

### Bull Board

Dashboard disponible sur http://localhost:3001/admin/queues

**Informations visibles** :

- Jobs actifs
- Jobs complétés
- Jobs échoués
- Statistiques de performance
- Retry automatique

### Logs

```typescript
// Logger NestJS intégré
private readonly logger = new Logger(MyService.name);

this.logger.log('✅ Success message');
this.logger.error('❌ Error message', error.stack);
this.logger.warn('⚠️  Warning message');
this.logger.debug('🔍 Debug info');
```

### PgAdmin

Interface web: http://localhost:5050

**Credentials** :

- Email: rzaki@hotmail.fr
- Password: admin

---

## 📚 Ressources Complémentaires

- [NestJS Official Docs](https://docs.nestjs.com/)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Bull Queue Guide](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md)
- [CoinGecko API Docs](https://www.coingecko.com/en/api/documentation)

---

**Dernière mise à jour**: 22 novembre 2025
