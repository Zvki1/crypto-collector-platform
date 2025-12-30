import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { EmailService } from '../email.service';

@Processor('email-notifications')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private emailService: EmailService) {}

  @Process('send-alert')
  async sendAlert(job: Job) {
    this.logger.log(`📧 Sending alert email for job ${job.id}`);

    await this.emailService.sendAlertEmail(job.data);

    return { success: true };
  }
}
