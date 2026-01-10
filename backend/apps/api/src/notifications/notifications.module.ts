import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { EmailService } from './email.service';
import { EmailProcessor } from './processors/email.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'email-notifications',
    }),
  ],
  providers: [EmailService, EmailProcessor],
  exports: [EmailService],
})
export class NotificationsModule {}
