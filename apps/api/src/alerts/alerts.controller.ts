import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { CreateAlertDto } from './dto/createAlert.dto';
import { UserId } from '../common/decorators/user-id.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth-guard.guard';

@UseGuards(JwtAuthGuard)
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Post()
  async createAlert(
    @UserId() userId: string,
    @Body() createAlertDto: CreateAlertDto,
  ) {
    return this.alertsService.CreateAlert(userId, createAlertDto);
  }
}
