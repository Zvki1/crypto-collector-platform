import { Controller, Get, Post, Query, Logger } from '@nestjs/common';
import { HistoricalDataService } from '../services/historical-data.service';

@Controller('historical')
export class HistoricalDataController {
  private readonly logger = new Logger(HistoricalDataController.name);

  constructor(private readonly historicalDataService: HistoricalDataService) {}

  /**
   * Lance l'import de l'historique pour toutes les cryptos
   * POST /historical/import?days=365
   */
  @Post('import')
  async importHistoricalData(@Query('days') days?: string) {
    const daysNum = days ? parseInt(days, 10) : 365;

    this.logger.log(`Starting historical data import for ${daysNum} days...`);

    // Lancer en background (ne pas bloquer la requête)
    this.historicalDataService
      .importHistoricalDataForAllCryptos(daysNum)
      .catch((error) => {
        this.logger.error('Historical import failed:', error);
      });

    return {
      message: `Historical data import started for ${daysNum} days`,
      status: 'processing',
      note: 'This runs in background. Check logs for progress.',
    };
  }

  /**
   * Récupère les statistiques sur les données historiques
   * GET /historical/stats
   */
  @Get('stats')
  async getStats() {
    const stats = await this.historicalDataService.getHistoricalDataStats();
    return {
      message: 'Historical data statistics',
      data: stats,
    };
  }

  /**
   * Import synchrone pour une crypto spécifique (pour tests)
   * POST /historical/import/:coingeckoId?days=365
   */
  @Post('import/:coingeckoId')
  async importForCrypto(
    @Query('coingeckoId') coingeckoId: string,
    @Query('days') days?: string,
  ) {
    const daysNum = days ? parseInt(days, 10) : 365;

    // Récupérer l'ID interne de la crypto
    const crypto = await this.historicalDataService[
      'prisma'
    ].cryptocurrency.findUnique({
      where: { coingeckoId },
    });

    if (!crypto) {
      return {
        success: false,
        message: `Cryptocurrency ${coingeckoId} not found in database`,
      };
    }

    const insertedCount =
      await this.historicalDataService.importHistoricalDataForCrypto(
        crypto.id,
        coingeckoId,
        daysNum,
      );

    return {
      success: true,
      message: `Imported ${insertedCount} records for ${coingeckoId}`,
      crypto: crypto.name,
      days: daysNum,
    };
  }
}
