import { PrismaService } from '@app/database';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class MarketDataService {
  constructor(private prisma: PrismaService) {}
  async findByCryptoID(cryptoId: string, days: number = 7) {
    // get a crypto market data filtering by days
    const crypto = await this.prisma.cryptocurrency.findUnique({
      where: {
        id: cryptoId,
      },
    });
    if (!crypto) {
      throw new NotFoundException(`Crypto avec l'id ${cryptoId} non trouvée`);
    }
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    return this.prisma.marketData.findMany({
      where: {
        cryptocurrencyId: cryptoId,
        timestamp: {
          gte: fromDate,
        },
      },
      orderBy: { timestamp: 'asc' },
    });
  }
  // --------------
  // --------------
  // get the last market data checkpoint of a crypto
  async findLatest(cryptoId: string) {
    const crypto = await this.prisma.cryptocurrency.findUnique({
      where: {
        id: cryptoId,
      },
    });
    if (!crypto) {
      throw new NotFoundException(`Crypto avec l'id ${cryptoId} non trouvée`);
    }
    const marketData = await this.prisma.marketData.findFirst({
      where: { cryptocurrencyId: cryptoId },
      orderBy: {
        timestamp: 'desc',
      },
    });
    if (!marketData) {
      throw new NotFoundException(
        `Aucune donnée de marché pour la crypto ${cryptoId}`,
      );
    }
    return marketData;
  }
}
