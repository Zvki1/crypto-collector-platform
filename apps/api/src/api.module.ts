import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // ← Ajoute ça
import { ApiController } from './api.controller';
import { ApiService } from './api.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DatabaseModule } from '@app/database';
import { CryptosModule } from './cryptos/cryptos.module';
import { MarketDataModule } from './market-data/market-data.module';
import { PortfolioModule } from './portfolio/portfolio.module';

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
  ],
  controllers: [ApiController],
  providers: [ApiService],
})
export class ApiModule {}
