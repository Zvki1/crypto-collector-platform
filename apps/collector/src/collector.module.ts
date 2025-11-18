import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from '@app/database';
import collectorConfig from './config/collector.config';
import { CoingeckoClientService } from './services/coingecko-client.service';
import { DataTransformerService } from './services/data-transformer.service';
import { StorageService } from './services/storage.service';
import { MarketDataCollectorJob } from './jobs/market-data-collector.job';
import { CollectorScheduler } from './collector.scheduler';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [collectorConfig],
      envFilePath: '.env',
    }),
    DatabaseModule,
    BullModule.forRootAsync({
      useFactory: () => ({
        redis: process.env.REDIS_URL
          ? process.env.REDIS_URL
          : {
              host: process.env.REDIS_HOST || 'localhost',
              port: parseInt(process.env.REDIS_PORT || '6379', 10),
            },
      }),
    }),
    BullModule.registerQueue({
      name: 'market-data-collection',
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [HealthController],
  providers: [
    CoingeckoClientService,
    DataTransformerService,
    StorageService,
    MarketDataCollectorJob,
    CollectorScheduler,
  ],
})
export class CollectorModule {}
