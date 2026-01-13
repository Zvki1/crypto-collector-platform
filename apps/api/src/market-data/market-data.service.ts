import { PrismaService } from '@app/database';
import { Injectable, NotFoundException } from '@nestjs/common';
import { MarketData } from '@prisma/client';

@Injectable()
export class MarketDataService {
  constructor(private prisma: PrismaService) {}

  async findByCryptoID(cryptoId: string, days: number = 7) {
    const crypto = await this.prisma.cryptocurrency.findUnique({
      where: {
        id: cryptoId,
      },
      select: {
        id: true,
        name: true,
        symbol: true,
        image: true,
      },
    });
    if (!crypto) {
      throw new NotFoundException(`Crypto avec l'id ${cryptoId} non trouvée`);
    }

    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    const allMarketData = await this.prisma.marketData.findMany({
      where: {
        cryptocurrencyId: cryptoId,
        timestamp: {
          gte: fromDate,
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    const marketData = this.aggregateMarketData(allMarketData, days);

    return { marketData, crypto };
  }
  private aggregateMarketData(data: MarketData[], days: number): MarketData[] {
    if (data.length === 0) return [];

    const isHourly = days <= 7;
    const groupedData = new Map<string, MarketData>();

    for (const record of data) {
      const date = new Date(record.timestamp);
      let key: string;

      if (isHourly) {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}`;
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      }

      groupedData.set(key, record);
    }

    return Array.from(groupedData.values()).sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
  }

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
      include: {
        cryptocurrency: {
          select: {
            symbol: true,
            name: true,
            image: true,
          },
        },
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
