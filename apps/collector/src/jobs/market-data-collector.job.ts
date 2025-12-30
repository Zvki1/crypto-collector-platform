import {
  Processor,
  Process,
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
} from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { CoingeckoClientService } from '../services/coingecko-client.service';
import { DataTransformerService } from '../services/data-transformer.service';
import { StorageService } from '../services/storage.service';
import { MarketDataEventService } from '../services/market-data-event.service';

@Processor('market-data-collection')
export class MarketDataCollectorJob {
  private readonly logger = new Logger(MarketDataCollectorJob.name);

  constructor(
    private coingeckoClient: CoingeckoClientService,
    private dataTransformer: DataTransformerService,
    private storage: StorageService,
    private marketDataEvent: MarketDataEventService,
  ) {}

  @Process('collect')
  async collectMarketData() {
    try {
      const cryptosToTrack = await this.storage.getAllCryptocurrencies();

      if (!cryptosToTrack || cryptosToTrack.length === 0) {
        this.logger.warn('⚠️ No cryptocurrencies to track in database');
        return { success: true, processed: 0 };
      }

      const cryptoIds = cryptosToTrack.map((crypto) => crypto.coingeckoId);

      this.logger.log(`📊 Starting collection for: ${cryptoIds.join(', ')}`);

      const marketDataList =
        await this.coingeckoClient.fetchMarketData(cryptoIds);

      for (const apiData of marketDataList) {
        try {
          // 2.1 Upsert cryptocurrency
          const cryptoEntity =
            this.dataTransformer.transformToCryptocurrency(apiData);
          const cryptocurrency =
            await this.storage.upsertCryptocurrency(cryptoEntity);

          // 2.2 Save market data
          const marketDataEntity = this.dataTransformer.transformToMarketData(
            apiData,
            cryptocurrency.id,
          );
          await this.storage.saveMarketData(marketDataEntity);
          await this.marketDataEvent.emitMarketDataCollected(
            cryptocurrency.id,
            apiData.current_price,
          );
          this.logger.log(
            `✅ Processed ${apiData.symbol.toUpperCase()} successfully + event emitted`,
          );
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          this.logger.error(
            `Failed to process ${apiData.symbol}: ${errorMessage}`,
          );
        }
      }

      return { success: true, processed: marketDataList.length };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Collection failed: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.log(`Processing job ${job.id} of type ${job.name}`);
  }

  @OnQueueCompleted()
  onCompleted(job: Job, result: any) {
    this.logger.log(
      `Job ${job.id} completed! Result: ${JSON.stringify(result)}`,
    );
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed! Error: ${error.message}`);
  }
}
