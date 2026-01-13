import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@app/database';

interface PredictionPoint {
  date: Date;
  predictedPrice: number;
  confidence: number;
}

interface HistoricalDataPoint {
  price: number;
  date: Date;
}

@Injectable()
export class PredictionsService {
  constructor(private prisma: PrismaService) {}

  async generateForecast(cryptoId: string, forecastDays: number) {
    const validPeriods = [7, 14, 30];
    if (!validPeriods.includes(forecastDays)) {
      throw new BadRequestException(
        `Période invalide. Choisissez parmi : ${validPeriods.join(', ')} jours`,
      );
    }

    const crypto = await this.prisma.cryptocurrency.findUnique({
      where: { id: cryptoId },
      select: {
        id: true,
        name: true,
        symbol: true,
        coingeckoId: true,
      },
    });

    if (!crypto) {
      throw new NotFoundException(
        `Cryptomonnaie introuvable avec l'ID: ${cryptoId}`,
      );
    }

    const historicalDays = 30;
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - historicalDays);

    const historicalData = await this.prisma.marketData.findMany({
      where: {
        cryptocurrencyId: cryptoId,
        timestamp: {
          gte: fromDate,
        },
      },
      orderBy: { timestamp: 'asc' },
      select: {
        currentPrice: true,
        timestamp: true,
      },
    });

    if (historicalData.length < 7) {
      throw new BadRequestException(
        'Pas assez de données historiques pour générer une prévision (minimum 7 jours)',
      );
    }

    const forecast = this.calculateSimpleMovingAverage(
      historicalData.map((d) => ({
        price: Number(d.currentPrice),
        date: d.timestamp,
      })),
      forecastDays,
    );

    return {
      crypto: {
        id: crypto.id,
        name: crypto.name,
        symbol: crypto.symbol,
      },
      forecast: {
        model: 'Simple Moving Average (SMA)',
        description: 'Moyenne mobile simple sur 20 périodes',
        forecastPeriod: forecastDays,
        generatedAt: new Date(),
        currentPrice: forecast.currentPrice,
        predictions: forecast.predictions,
      },
      metadata: {
        historicalDataPoints: historicalData.length,
        windowSize: 20, // fenetre de calcul de la moyenne
      },
    };
  }

  private calculateSimpleMovingAverage(
    data: HistoricalDataPoint[],
    forecastDays: number,
  ) {
    const windowSize = 20;
    const prices = data.map((d) => d.price);
    const dates = data.map((d) => d.date);

    const currentPrice = prices[prices.length - 1];

    const recentPrices = prices.slice(-windowSize);
    const sma =
      recentPrices.reduce((sum, price) => sum + price, 0) / recentPrices.length;

    const trend = this.calculateTrend(recentPrices);

    const predictions: PredictionPoint[] = [];
    const lastDate = dates[dates.length - 1];

    for (let i = 1; i <= forecastDays; i++) {
      const futureDate = new Date(lastDate);
      futureDate.setDate(futureDate.getDate() + i);

      const dampening = 0.8;
      const predictedPrice = sma + trend * i * dampening;

      predictions.push({
        date: futureDate,
        predictedPrice: Math.max(0, predictedPrice),
        confidence: this.calculateConfidence(i, forecastDays),
      });
    }

    return {
      currentPrice,
      predictedPrice7d:
        predictions.length >= 7 ? predictions[6].predictedPrice : null,
      predictions,
    };
  }

  private calculateTrend(prices: number[]): number {
    if (prices.length < 2) return 0;

    let sumDiff = 0;
    for (let i = 1; i < prices.length; i++) {
      sumDiff += prices[i] - prices[i - 1];
    }

    return sumDiff / (prices.length - 1);
  }

  private calculateConfidence(dayNumber: number, totalDays: number): number {
    const maxConfidence = 0.95;
    const minConfidence = 0.6;

    const confidenceDrop =
      (maxConfidence - minConfidence) * (dayNumber / totalDays);
    return Math.round((maxConfidence - confidenceDrop) * 100) / 100;
  }
}
