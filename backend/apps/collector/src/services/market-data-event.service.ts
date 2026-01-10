import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import bull from 'bull';

@Injectable()
export class MarketDataEventService {
  constructor(
    @InjectQueue('market-data-events')
    private readonly eventQueue: bull.Queue,
  ) {}

  async emitMarketDataCollected(
    cryptoId: string,
    currentPrice: number,
  ): Promise<void> {
    await this.eventQueue.add('market-data-collected', {
      cryptoId,
      currentPrice,
      timestamp: new Date().toISOString(),
    });
  }
}
