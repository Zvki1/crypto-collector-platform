import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { PredictionsService } from './predictions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth-guard.guard';

@Controller('predictions')
@UseGuards(JwtAuthGuard)
export class PredictionsController {
  constructor(private readonly predictionsService: PredictionsService) {}

  @Get(':cryptoId')
  async getForecast(
    @Param('cryptoId') cryptoId: string,
    @Query('period', new ParseIntPipe({ optional: true })) period = 7,
  ) {
    return this.predictionsService.generateForecast(cryptoId, period);
  }
}
