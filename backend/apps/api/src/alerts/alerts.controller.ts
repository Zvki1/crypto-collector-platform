import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { CreateAlertDto } from './dto/createAlert.dto';
import { UserId } from '../common/decorators/user-id.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth-guard.guard';
import { ResponseMessage } from '../common/decorators/response-message.decorator';

@UseGuards(JwtAuthGuard)
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Post()
  @ResponseMessage('Alert created successfully')
  async createAlert(
    @UserId() userId: string,
    @Body() createAlertDto: CreateAlertDto,
  ) {
    return this.alertsService.CreateAlert(userId, createAlertDto);
  }
  @Get()
  async findAlerts(@UserId() userId: string) {
    return this.alertsService.getAlerts(userId);
  }
  @Delete(':id')
  async removeAler(@Param('id') id: string, @UserId() userId: string) {
    return this.alertsService.deleteAlert(id, userId);
  }
}
