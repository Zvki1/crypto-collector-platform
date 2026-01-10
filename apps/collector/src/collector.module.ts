import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from 'libs/database/src';
import collectorConfig from './config/collector.config';
import { CoingeckoClientService } from './services/coingecko-client.service';
import { DataTransformerService } from './services/data-transformer.service';
import { StorageService } from './services/storage.service';
import { MarketDataCollectorJob } from './jobs/market-data-collector.job';
import { CollectorScheduler } from './collector.scheduler';
import { HealthController } from './health/health.controller';
import { MarketDataEventService } from './services/market-data-event.service';
import { TestController } from './test/test.controller';

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
    BullModule.registerQueue({
      name: 'market-data-events',
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [HealthController, TestController],
  providers: [
    CoingeckoClientService,
    DataTransformerService,
    StorageService,
    MarketDataCollectorJob,
    CollectorScheduler,
    MarketDataEventService,
  ],
})
export class CollectorModule {}
