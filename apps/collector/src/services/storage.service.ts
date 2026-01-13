import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@app/database';
import { Prisma, Cryptocurrency, MarketData } from '@prisma/client';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(private prisma: PrismaService) {}
  // fetch tous les crypto disponible dans la BDD
  async getAllCryptocurrencies() {
    return this.prisma.cryptocurrency.findMany({
      select: {
        id: true,
        coingeckoId: true,
        symbol: true,
        name: true,
      },
    });
  }

  /**
   * Crée ou met à jour une cryptomonnaie
   */
  async upsertCryptocurrency(
    data: Prisma.CryptocurrencyCreateInput,
  ): Promise<Cryptocurrency> {
    try {
      return await this.prisma.cryptocurrency.upsert({
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
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.error(`Failed to upsert cryptocurrency: ${error.message}`);
      throw error;
    }
  }

  /**
   * Sauvegarde les données de marché (évite les doublons via contrainte unique)
   */
  async saveMarketData(
    data: Prisma.MarketDataCreateInput,
  ): Promise<MarketData> {
    try {
      return await this.prisma.marketData.create({
        data,
      });
    } catch (error) {
      // Ignore les erreurs de contrainte unique (doublon timestamp)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (error.code === 'P2002') {
        this.logger.warn('Duplicate market data entry, skipping...');
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
        return error.code;
        // change null to error.code
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.error(`Failed to save market data: ${error.message}`);
      throw error;
    }
  }
}
