import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Job, Queue } from 'bull';
import { AlertStatus, AlertType } from '@prisma/client';
import { PrismaService } from 'backend/libs/database/src';

@Processor('market-data-events')
export class AlertCheckerProcessor {
  private readonly logger = new Logger(AlertCheckerProcessor.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue('email-notifications')
    private emailQueue: Queue,
  ) {}

  @Process('market-data-collected')
  async checkAlerts(job: Job<{ cryptoId: string; currentPrice: number }>) {
    const { cryptoId, currentPrice } = job.data;
    this.logger.log(`========================================`);
    this.logger.log(`RECEIVED EVENT:`);
    this.logger.log(`   Crypto ID: ${cryptoId}`);
    this.logger.log(`   Current Price: ${currentPrice}`);
    this.logger.log(`========================================`);
    this.logger.log(
      `Checking alerts for crypto ${cryptoId} at price ${currentPrice}`,
    );

    const alerts = await this.prisma.alert.findMany({
      where: {
        cryptocurrencyId: cryptoId,
        status: AlertStatus.ACTIVE,
      },
      include: {
        user: true,
        cryptocurrency: true,
      },
    });
    if (alerts.length === 0) {
      this.logger.log(`No active alerts for crypto ${cryptoId}`);
      return { checked: 0, triggered: 0 };
    }
    this.logger.log(`Found ${alerts.length} ACTIVE alerts for this crypto`);

    let triggeredCount = 0;

    for (const alert of alerts) {
      const targetPrice = alert.targetPrice.toNumber();
      this.logger.log(`---`);
      this.logger.log(`Checking Alert ID: ${alert.id}`);
      this.logger.log(`   Type: ${alert.type}`);
      this.logger.log(`   Target Price: ${targetPrice}`);
      this.logger.log(`   Current Price: ${currentPrice}`);
      const shouldTrigger = this.evaluateCondition(alert, currentPrice);

      if (shouldTrigger) {
        this.logger.log(`Alert ${alert.id} triggered!`);

        await this.prisma.alert.update({
          where: { id: alert.id },
          data: {
            status: AlertStatus.TRIGGERED,
            triggeredAt: new Date(),
          },
        });

        await this.emailQueue.add('send-alert', {
          alertId: alert.id,
          userEmail: alert.user.email,
          userName: alert.user.username,
          cryptoSymbol: alert.cryptocurrency.symbol,
          cryptoName: alert.cryptocurrency.name,
          targetPrice: alert.targetPrice.toNumber(),
          currentPrice: currentPrice,
          alertType: alert.type,
        });

        triggeredCount++;
      }
    }

    this.logger.log(
      `Checked ${alerts.length} alerts, ${triggeredCount} triggered`,
    );

    return {
      checked: alerts.length,
      triggered: triggeredCount,
    };
  }

  private evaluateCondition(
    alert: { targetPrice: { toNumber: () => number }; type: AlertType },
    currentPrice: number,
  ): boolean {
    const target = alert.targetPrice.toNumber();
    this.logger.debug(
      `Evaluating: ${currentPrice} > ${target} ? (type: ${alert.type})`,
    );

    switch (alert.type) {
      case AlertType.PRICE_ABOVE:
        return currentPrice > target;

      case AlertType.PRICE_BELOW:
        return currentPrice < target;

      default:
        return false;
    }
  }
}
