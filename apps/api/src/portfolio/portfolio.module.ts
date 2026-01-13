import { Module } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { PortfolioController } from './portfolio.controller';
import { DatabaseModule } from '@app/database';
import { JwtModule } from '@nestjs/jwt';

@Module({
  providers: [PortfolioService],
  controllers: [PortfolioController],
  imports: [DatabaseModule, JwtModule],
})
export class PortfolioModule {}
