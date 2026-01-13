/**
 * Script pour importer l'historique des prix crypto sur 1 an
 * Usage: npx ts-node scripts/import-historical-data.ts
 */

import { PrismaClient } from '@prisma/client';
import Bottleneck from 'bottleneck';

const prisma = new PrismaClient();

// Rate limiter pour CoinGecko (max 10-30 req/min sur free tier)
const limiter = new Bottleneck({
  minTime: 3000, // 3 secondes entre chaque requête
  maxConcurrent: 1,
});

interface CoinGeckoMarketChartResponse {
  prices: [number, number][];
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

async function fetchMarketChart(
  coingeckoId: string,
  days: number = 365,
): Promise<CoinGeckoMarketChartResponse> {
  const url = `https://api.coingecko.com/api/v3/coins/${coingeckoId}/market_chart?vs_currency=eur&days=${days}`;

  console.log(`Fetching ${coingeckoId} (${days} days)...`);

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(
      `CoinGecko API error: ${response.status} ${response.statusText}`,
    );
  }

  return (await response.json()) as CoinGeckoMarketChartResponse;
}

async function importHistoricalData() {
  console.log("Démarrage de l'import des données historiques (1 an)\n");

  // Récupérer toutes les cryptos trackées
  const cryptos = await prisma.cryptocurrency.findMany({
    where: { isActive: true },
    select: { id: true, coingeckoId: true, symbol: true, name: true },
  });

  if (cryptos.length === 0) {
    console.log('Aucune crypto trouvée dans la base de données.');
    console.log('   Assure-toi que le collector a déjà importé les cryptos.');
    return;
  }

  console.log(
    `${cryptos.length} cryptos à traiter: ${cryptos.map((c) => c.symbol).join(', ')}\n`,
  );

  let totalImported = 0;
  let totalSkipped = 0;

  for (const crypto of cryptos) {
    try {
      // Utiliser le rate limiter
      const data = await limiter.schedule(() =>
        fetchMarketChart(crypto.coingeckoId, 365),
      );

      console.log(`   └─ ${data.prices.length} points de données reçus`);

      // Transformer et insérer les données
      let imported = 0;
      let skipped = 0;

      for (let i = 0; i < data.prices.length; i++) {
        const [timestamp, price] = data.prices[i];
        const marketCap = data.market_caps[i]?.[1] || 0;
        const volume = data.total_volumes[i]?.[1] || 0;

        const recordedAt = new Date(timestamp);

        try {
          await prisma.marketData.create({
            data: {
              cryptocurrencyId: crypto.id,
              currentPrice: price,
              marketCap: marketCap,
              totalVolume: volume,
              timestamp: recordedAt,
            },
          });
          imported++;
        } catch (error: unknown) {
          // P2002 = unique constraint violation (donnée déjà existante)
          const prismaError = error as { code?: string };
          if (prismaError.code === 'P2002') {
            skipped++;
          } else {
            throw error;
          }
        }
      }

      console.log(
        `   ${crypto.symbol}: ${imported} importés, ${skipped} déjà existants\n`,
      );
      totalImported += imported;
      totalSkipped += skipped;
    } catch (error) {
      console.error(`   Erreur pour ${crypto.symbol}:`, error);
    }
  }

  console.log('═'.repeat(50));
  console.log(`Import terminé!`);
  console.log(`   total importés: ${totalImported}`);
  console.log(`   Total ignorés (doublons): ${totalSkipped}`);
}

// Exécution
importHistoricalData()
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
