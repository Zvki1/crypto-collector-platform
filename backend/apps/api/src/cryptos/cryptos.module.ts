import { Module } from '@nestjs/common';
import { CryptosService } from './cryptos.service';
import { CryptosController } from './cryptos.controller';
import { DatabaseModule } from 'backend/libs/database/src';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [DatabaseModule, HttpModule],
  providers: [CryptosService],
  controllers: [CryptosController],
  exports: [CryptosService],
})
export class CryptosModule {}
