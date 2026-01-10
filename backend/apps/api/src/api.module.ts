import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // ← Ajoute ça
import { ApiController } from './api.controller';
import { ApiService } from './api.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DatabaseModule } from 'backend/libs/database/src';
import { CryptosModule } from './cryptos/cryptos.module';
import { MarketDataModule } from './market-data/market-data.module';
import { PortfolioModule } from './portfolio/portfolio.module';
import { AlertsModule } from './alerts/alerts.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    CryptosModule,
    MarketDataModule,
    PortfolioModule,
    AlertsModule,
    NotificationsModule,
  ],
  controllers: [ApiController],
  providers: [ApiService],
})
export class ApiModule {}
