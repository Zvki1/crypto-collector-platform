import { Controller, Post, Body } from '@nestjs/common';
import { MarketDataEventService } from '../services/market-data-event.service';

@Controller('test')
export class TestController {
  constructor(private eventService: MarketDataEventService) {}

  @Post('emit-fake-event')
  async emitFakeEvent(
    @Body() body: { cryptoId: string; currentPrice: number },
  ) {
    await this.eventService.emitMarketDataCollected(
      body.cryptoId,
      body.currentPrice,
    );
    return {
      message: 'Event emitted successfully',
      cryptoId: body.cryptoId,
      currentPrice: body.currentPrice,
    };
  }
}
