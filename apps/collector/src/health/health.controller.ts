import { Controller, Get } from '@nestjs/common';
import { PrismaService } from 'libs/database/src';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';

@Controller('health')
export class HealthController {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('market-data-collection') private queue: Queue,
  ) {}

  @Get()
  async check() {
    try {
      // Test de connexion DB
      await this.prisma.$queryRaw`SELECT 1`;

      // Stats de la queue
      const [waiting, active, completed, failed] = await Promise.all([
        this.queue.getWaitingCount(),
        this.queue.getActiveCount(),
        this.queue.getCompletedCount(),
        this.queue.getFailedCount(),
      ]);

      // Dernière collecte
      const lastMarketData = await this.prisma.marketData.findFirst({
        orderBy: { timestamp: 'desc' },
        include: {
          cryptocurrency: {
            select: { symbol: true },
          },
        },
      });

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        database: {
          status: 'connected',
          lastCollection: lastMarketData
            ? {
                crypto: lastMarketData.cryptocurrency.symbol,
                timestamp: lastMarketData.timestamp,
              }
            : null,
        },
        queue: {
          waiting,
          active,
          completed,
          failed,
        },
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          unit: 'MB',
        },
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        error: error.message,
      };
    }
  }

  @Get('simple')
  simple() {
    // Health check ultra-simple pour UptimeRobot
    return { status: 'ok' };
  }
}
