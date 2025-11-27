import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // ← Ajoute ça
import { ApiController } from './api.controller';
import { ApiService } from './api.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DatabaseModule } from '@app/database';
import { CryptosModule } from './cryptos/cryptos.module';
import { MarketDataModule } from './market-data/market-data.module';

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
  ],
  controllers: [ApiController],
  providers: [ApiService],
})
export class ApiModule {}
