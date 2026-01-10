import { Module } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { AlertsController } from './alerts.controller';
import { BullModule } from '@nestjs/bull';
import { AlertCheckerProcessor } from './processors/alert-checker.processor';
@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'market-data-events' },
      { name: 'email-notifications' },
    ),
  ],
  providers: [AlertsService, AlertCheckerProcessor],
  controllers: [AlertsController],
})
export class AlertsModule {}
