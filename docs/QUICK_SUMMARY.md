# 📝 Résumé Rapide du Projet

> Document de référence rapide pour comprendre le projet en 5 minutes

---

## ❓ C'est quoi ?

Une plateforme qui **collecte automatiquement** les données de cryptomonnaies (Bitcoin, Ethereum, Solana) depuis CoinGecko toutes les 5 minutes et les stocke dans PostgreSQL.

---

## 🎯 Objectif

Avoir un historique complet des données de marché pour :

- Analyser les tendances
- Créer des graphiques
- Développer des stratégies de trading
- Faire du backtesting

---

## 🏗️ Comment ça marche ?

### Flow Simple

```
1. ⏰ Toutes les 5 minutes → Un scheduler se déclenche
2. 📥 Requête API → Récupère les données de CoinGecko
3. 🔄 Transformation → Convertit au format base de données
4. 💾 Sauvegarde → Stocke dans PostgreSQL
5. 🔁 Répète...
```

### Architecture en 3 Parties

```
┌─────────────┐
│  Collector  │  ← Service qui collecte (port 3001)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Database   │  ← PostgreSQL + Prisma
└──────┬──────┘
       │
       ▼
┌─────────────┐
│     API     │  ← API REST pour consulter (port 3000)
└─────────────┘
```

---

## 🗂️ Structure du Code

```
apps/
├── collector/              ← Service de collecte
│   ├── scheduler.ts       ← Déclenche toutes les 5 min
│   ├── jobs/              ← Traite la collecte
│   └── services/          ← Logique métier
│       ├── coingecko-client.service.ts    ← Appelle l'API
│       ├── data-transformer.service.ts    ← Transforme les données
│       └── storage.service.ts             ← Sauvegarde en BDD
│
└── api/                   ← API REST (à développer)

libs/
├── database/              ← Module Prisma partagé
└── common/                ← Services communs

prisma/
└── schema.prisma          ← Définition des tables BDD
```

---

## 🗄️ Base de Données

### 2 Tables Principales

#### 1. `cryptocurrencies`

Informations statiques des cryptos :

- ID, nom, symbole (BTC, ETH, SOL)
- Image, rang de capitalisation
- Dates de création/mise à jour

#### 2. `market_data`

Données de marché horodatées :

- Prix actuel
- Prix max/min 24h
- Variation de prix (1h, 24h)
- Capitalisation
- Volume
- Supply (circulant, total, max)
- ATH/ATL (all-time high/low)
- **Timestamp** (très important !)

### Relation

```
cryptocurrencies (1) -----> (N) market_data
      Bitcoin    ──────────> Data toutes les 5 min
```

---

## 🔑 Concepts NestJS Clés

### 1. **Modules** (`@Module`)

Comme des "boîtes" qui contiennent du code lié :

```typescript
@Module({
  imports: [DatabaseModule],    // Modules dont on a besoin
  providers: [MonService],       // Services disponibles
  controllers: [MonController],  // Contrôleurs HTTP
})
```

### 2. **Services** (`@Injectable`)

Contiennent la logique métier :

```typescript
@Injectable()
export class CoingeckoService {
  async fetchData() {
    /* ... */
  }
}
```

### 3. **Injection de Dépendances**

NestJS injecte automatiquement les services :

```typescript
constructor(private coingeckoService: CoingeckoService) {
  // coingeckoService est injecté automatiquement !
}
```

### 4. **Queues (Bull)**

Pour traiter des tâches en arrière-plan :

```typescript
// Ajouter une tâche
await queue.add('collect', {});

// Traiter la tâche
@Process('collect')
async handleCollect() { /* ... */ }
```

---

## 🚀 Commandes à Retenir

```bash
# Démarrer Docker (BDD + Redis)
docker-compose up -d

# Démarrer le Collector
npm run start:dev collector

# Voir le dashboard des jobs
# → http://localhost:3001/admin/queues

# Voir la BDD graphiquement
npx prisma studio

# Générer le client Prisma après modification du schéma
npx prisma generate

# Créer une migration après modification du schéma
npx prisma migrate dev --name nom_migration
```

---

## 📊 Que se passe-t-il actuellement ?

### ✅ Fonctionnel

1. **Collector** collecte automatiquement toutes les 5 minutes
2. **Données** sont stockées dans PostgreSQL
3. **Dashboard Bull Board** pour voir les jobs
4. **Docker** pour infrastructure (BDD, Redis, PgAdmin)

### 🚧 À Faire

1. **API REST** pour consulter les données (structure existe, endpoints à faire)
2. **Tests** unitaires et d'intégration
3. **Plus de cryptos** (actuellement 3 seulement)
4. **Dashboard web** pour visualiser

---

## 🛠️ Technologies en 1 Ligne

- **NestJS** : Framework backend (comme Express mais structuré)
- **TypeScript** : JavaScript avec des types
- **Prisma** : Pour communiquer avec la BDD (ORM)
- **Bull** : Système de queues pour jobs en arrière-plan
- **PostgreSQL** : Base de données relationnelle
- **Redis** : Cache utilisé par Bull
- **Docker** : Tout dans des containers
- **Axios** : Pour faire des requêtes HTTP

---

## 📈 Données Collectées (Exemple Bitcoin)

```json
{
  "nom": "Bitcoin",
  "symbole": "BTC",
  "prix_actuel": 35420.5,
  "prix_max_24h": 36250.0,
  "prix_min_24h": 34890.0,
  "variation_24h": "+1.52%",
  "capitalisation": 692385749203,
  "volume": 25837492847,
  "supply_circulant": 19554150,
  "supply_max": 21000000,
  "ath": 69045.0,
  "atl": 67.81,
  "timestamp": "2025-11-22 10:30:00"
}
```

Toutes les 5 minutes, une nouvelle ligne est ajoutée !

---

## 🎓 Pour Aller Plus Loin

### Documentation Complète

- **[PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md)** : Doc complète (40+ pages)
- **[TECHNICAL_GUIDE.md](TECHNICAL_GUIDE.md)** : Guide technique développeur

### Ressources NestJS

- [Docs officielles NestJS](https://docs.nestjs.com/)
- [Prisma Docs](https://www.prisma.io/docs)
- [Bull Queue Guide](https://github.com/OptimalBits/bull)

---

## 💡 Astuces Debugging

### Le collector ne collecte pas ?

```bash
# 1. Vérifier les logs
docker-compose logs -f

# 2. Vérifier Bull Board
# http://localhost:3001/admin/queues

# 3. Vérifier que Redis/PostgreSQL tournent
docker ps
```

### Erreur Prisma ?

```bash
# Régénérer le client
npx prisma generate

# Vérifier la connexion BDD
npx prisma db pull
```

---

## 🎯 Points Clés à Retenir

1. **2 applications** : Collector + API
2. **Collecte automatique** toutes les 5 minutes
3. **Bull Queue** pour gérer les jobs
4. **Prisma** pour la base de données
5. **Docker** pour tout l'environnement
6. **Architecture modulaire** NestJS

---

**Dernière mise à jour**: 22 novembre 2025

---

_Ce document est une version condensée. Pour plus de détails, consultez PROJECT_DOCUMENTATION.md_
