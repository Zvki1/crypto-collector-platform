import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { ApiController } from './api.controller';
import { ApiService } from './api.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CryptosModule } from './cryptos/cryptos.module';
import { MarketDataModule } from './market-data/market-data.module';
import { PortfolioModule } from './portfolio/portfolio.module';
import { AlertsModule } from './alerts/alerts.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DatabaseModule } from 'libs/database/src';
import { PaymentsModule } from './payments/payments.module';
import { PredictionsModule } from './predictions/predictions.module';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { MetricsModule } from './common/metrics/metrics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Bull/Redis Configuration
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
    // Prometheus Metrics
    PrometheusModule.register({
      defaultMetrics: {
        enabled: true,
      },
      path: '/metrics',
    }),
    MetricsModule, // Importe le MetricsModule qui fournit les métriques custom
    DatabaseModule,
    AuthModule,
    UsersModule,
    CryptosModule,
    MarketDataModule,
    PortfolioModule,
    AlertsModule,
    NotificationsModule,
    PaymentsModule,
    PredictionsModule,
  ],
  controllers: [ApiController],
  providers: [ApiService],
})
export class ApiModule {}
