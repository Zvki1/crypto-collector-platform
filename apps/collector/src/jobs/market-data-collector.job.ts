import {
  Processor,
  Process,
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
} from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Job } from 'bull';
import { CoingeckoClientService } from '../services/coingecko-client.service';
import { DataTransformerService } from '../services/data-transformer.service';
import { StorageService } from '../services/storage.service';

@Processor('market-data-collection')
export class MarketDataCollectorJob {
  private readonly logger = new Logger(MarketDataCollectorJob.name);

  constructor(
    private coingeckoClient: CoingeckoClientService,
    private dataTransformer: DataTransformerService,
    private storage: StorageService,
    private configService: ConfigService,
  ) {}

  @Process('collect')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async collectMarketData(job: Job) {
    const cryptoIds = this.configService.get<string[]>('collector.cryptoIds');

    if (!cryptoIds || cryptoIds.length === 0) {
      this.logger.error('No crypto IDs configured for collection');
      throw new Error('No crypto IDs configured for collection');
    }

    this.logger.log(`Starting collection for: ${cryptoIds.join(', ')}`);

    try {
      // 1. Fetch data from CoinGecko
      const marketDataList =
        await this.coingeckoClient.fetchMarketData(cryptoIds);

      // 2. Process each cryptocurrency
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

          this.logger.log(
            `✅ Processed ${apiData.symbol.toUpperCase()} successfully`,
          );
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          this.logger.error(
            `Failed to process ${apiData.symbol}: ${errorMessage}`,
          );
          // Continue avec les autres cryptos même si une échoue
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
