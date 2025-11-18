import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CollectorScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CollectorScheduler.name);
  private intervalId?: NodeJS.Timeout;

  constructor(
    @InjectQueue('market-data-collection') private collectionQueue: Queue,
    private configService: ConfigService,
  ) {}

  /**
   * Collecte périodique toutes les X minutes (défini dans .env)
   * Par défaut: toutes les 5 minutes
   */
  async scheduleCollection() {
    const intervalMinutes = this.configService.get<number>(
      'collector.intervalMinutes',
      5, // default value
    );
    this.logger.log(
      `Scheduling market data collection (interval: ${intervalMinutes}min)`,
    );

    try {
      await this.collectionQueue.add(
        'collect',
        {},
        {
          attempts: 3, // Retry 3 fois en cas d'échec
          backoff: {
            type: 'exponential',
            delay: 5000, // Délai initial de 5s, puis exponentiel
          },
        },
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to schedule collection: ${errorMessage}`);
    }
  }

  /**
   * Initialize scheduler and trigger initial collection
   */
  async onModuleInit() {
    this.logger.log('Initializing collector scheduler...');

    // Start periodic collection
    this.startPeriodicCollection();

    // Trigger initial collection
    this.logger.log('Triggering initial collection on startup...');
    try {
      await this.collectionQueue.add(
        'collect',
        {},
        {
          attempts: 3,
        },
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to trigger initial collection: ${errorMessage}`,
      );
    }
  }

  /**
   * Start periodic collection using setInterval
   */
  private startPeriodicCollection() {
    const intervalMinutes = this.configService.get<number>(
      'collector.intervalMinutes',
      5, // default value
    );

    const intervalMs = intervalMinutes * 60 * 1000; // Convert to milliseconds

    this.logger.log(
      `Starting periodic collection every ${intervalMinutes} minutes`,
    );

    this.intervalId = setInterval(() => {
      this.scheduleCollection().catch((error) => {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Periodic collection failed: ${errorMessage}`);
      });
    }, intervalMs);
  }

  /**
   * Stop periodic collection
   */
  onModuleDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.logger.log('Stopped periodic collection');
    }
  }
}
