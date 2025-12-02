import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { MarketDataService } from './market-data.service';
import { FilterMarketDataDto } from './dto/filter-market-data.dto';

@Controller('market-data')
export class MarketDataController {
  constructor(private readonly marketDataService: MarketDataService) {}
  @Get()
  async getHistory(@Query() query: FilterMarketDataDto) {
    return this.marketDataService.findByCryptoID(
      query.cryptoId,
      query.days ? parseInt(query.days) : undefined,
    );
  }
  @Get(':cryptoId')
  async getLatestHistory(@Param('cryptoId', ParseUUIDPipe) cryptoId: string) {
    return this.marketDataService.findLatest(cryptoId);
  }
}
