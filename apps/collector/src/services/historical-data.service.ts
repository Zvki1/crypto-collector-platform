import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@app/database';
import {
  CoingeckoClientService,
  CoinGeckoMarketChartResponse,
} from './coingecko-client.service';
import { StorageService } from './storage.service';
import { Prisma } from '@prisma/client';

interface HistoricalDataPoint {
  timestamp: Date;
  currentPrice: number;
  marketCap: number | null;
  totalVolume: number | null;
}

@Injectable()
export class HistoricalDataService {
  private readonly logger = new Logger(HistoricalDataService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly coingeckoClient: CoingeckoClientService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Importe l'historique des prix pour toutes les cryptos trackées
   * @param days Nombre de jours d'historique (défaut: 365)
   */
  async importHistoricalDataForAllCryptos(days: number = 365): Promise<void> {
    this.logger.log(`Starting historical data import for ${days} days...`);

    // Récupérer toutes les cryptos de la BDD
    const cryptos = await this.storageService.getAllCryptocurrencies();

    if (cryptos.length === 0) {
      this.logger.warn(
        'No cryptocurrencies found in database. Run collector first.',
      );
      return;
    }

    this.logger.log(`Found ${cryptos.length} cryptocurrencies to process`);

    for (const crypto of cryptos) {
      try {
        await this.importHistoricalDataForCrypto(
          crypto.id,
          crypto.coingeckoId,
          days,
        );
        this.logger.log(
          `✅ Completed import for ${crypto.name} (${crypto.symbol})`,
        );
      } catch (error) {
        this.logger.error(
          `❌ Failed to import historical data for ${crypto.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
        // Continue avec la crypto suivante
      }
    }

    this.logger.log('Historical data import completed!');
  }

  /**
   * Importe l'historique des prix pour une crypto spécifique
   */
  async importHistoricalDataForCrypto(
    cryptocurrencyId: string,
    coingeckoId: string,
    days: number = 365,
  ): Promise<number> {
    this.logger.log(`Importing ${days} days of data for ${coingeckoId}...`);

    // Récupérer les données depuis CoinGecko
    const chartData = await this.coingeckoClient.fetchMarketChart(
      coingeckoId,
      days,
      'eur',
    );

    // Transformer les données
    const dataPoints = this.transformChartData(chartData);

    this.logger.log(`Transforming ${dataPoints.length} data points...`);

    // Insérer les données par batch pour éviter les timeouts
    const batchSize = 100;
    let insertedCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < dataPoints.length; i += batchSize) {
      const batch = dataPoints.slice(i, i + batchSize);

      for (const point of batch) {
        try {
          await this.prisma.marketData.create({
            data: {
              cryptocurrencyId,
              currentPrice: point.currentPrice,
              marketCap: point.marketCap,
              totalVolume: point.totalVolume,
              timestamp: point.timestamp,
              // Les autres champs seront null pour les données historiques
              high24h: null,
              low24h: null,
              priceChange24h: null,
              priceChangePercentage24h: null,
              priceChangePercentage1h: null,
              fullyDilutedValuation: null,
              marketCapChange24h: null,
              marketCapChangePercentage24h: null,
              circulatingSupply: null,
              totalSupply: null,
              maxSupply: null,
              ath: null,
              athChangePercentage: null,
              athDate: null,
              atl: null,
              atlChangePercentage: null,
              atlDate: null,
            },
          });
          insertedCount++;
        } catch (error) {
          // Ignorer les doublons (contrainte unique sur cryptocurrencyId + timestamp)
          if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2002'
          ) {
            skippedCount++;
          } else {
            throw error;
          }
        }
      }

      // Log de progression
      const progress = Math.min(i + batchSize, dataPoints.length);
      this.logger.log(
        `Progress: ${progress}/${dataPoints.length} (${insertedCount} inserted, ${skippedCount} skipped)`,
      );
    }

    this.logger.log(
      `Completed: ${insertedCount} new records, ${skippedCount} duplicates skipped`,
    );

    return insertedCount;
  }

  /**
   * Transforme les données CoinGecko en format compatible avec MarketData
   */
  private transformChartData(
    chartData: CoinGeckoMarketChartResponse,
  ): HistoricalDataPoint[] {
    const { prices, market_caps, total_volumes } = chartData;

    // Créer une map pour les market caps et volumes par timestamp
    const marketCapMap = new Map<number, number>();
    const volumeMap = new Map<number, number>();

    for (const [timestamp, marketCap] of market_caps) {
      marketCapMap.set(timestamp, marketCap);
    }

    for (const [timestamp, volume] of total_volumes) {
      volumeMap.set(timestamp, volume);
    }

    // Transformer les prix en DataPoints
    return prices.map(([timestamp, price]) => {
      // Trouver le market cap et volume le plus proche du timestamp
      const marketCap = this.findClosestValue(marketCapMap, timestamp);
      const totalVolume = this.findClosestValue(volumeMap, timestamp);

      return {
        timestamp: new Date(timestamp),
        currentPrice: price,
        marketCap,
        totalVolume,
      };
    });
  }

  /**
   * Trouve la valeur la plus proche d'un timestamp donné
   */
  private findClosestValue(
    map: Map<number, number>,
    targetTimestamp: number,
  ): number | null {
    // Essayer d'abord le timestamp exact
    if (map.has(targetTimestamp)) {
      return map.get(targetTimestamp) || null;
    }

    // Sinon, chercher le plus proche (dans une fenêtre de 1 heure)
    const tolerance = 3600000; // 1 heure en ms
    for (const [ts, value] of map.entries()) {
      if (Math.abs(ts - targetTimestamp) <= tolerance) {
        return value;
      }
    }

    return null;
  }

  /**
   * Vérifie si l'historique existe déjà pour une crypto
   */
  async hasHistoricalData(
    cryptocurrencyId: string,
    days: number,
  ): Promise<boolean> {
    const oldestDate = new Date();
    oldestDate.setDate(oldestDate.getDate() - days);

    const count = await this.prisma.marketData.count({
      where: {
        cryptocurrencyId,
        timestamp: {
          lte: oldestDate,
        },
      },
    });

    return count > 0;
  }

  /**
   * Récupère des statistiques sur les données historiques
   */
  async getHistoricalDataStats(): Promise<
    {
      crypto: string;
      count: number;
      oldestDate: Date | null;
      newestDate: Date | null;
    }[]
  > {
    const cryptos = await this.storageService.getAllCryptocurrencies();
    const stats: {
      crypto: string;
      count: number;
      oldestDate: Date | null;
      newestDate: Date | null;
    }[] = [];

    for (const crypto of cryptos) {
      const aggregation = await this.prisma.marketData.aggregate({
        where: { cryptocurrencyId: crypto.id },
        _count: true,
        _min: { timestamp: true },
        _max: { timestamp: true },
      });

      stats.push({
        crypto: `${crypto.name} (${crypto.symbol})`,
        count: aggregation._count,
        oldestDate: aggregation._min.timestamp,
        newestDate: aggregation._max.timestamp,
      });
    }

    return stats;
  }
}
