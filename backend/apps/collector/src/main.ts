import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter as BullBoardExpressAdapter } from '@bull-board/express';
import Bull from 'bull';
import { CollectorModule } from './collector.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(CollectorModule, {
    logger: ['log', 'error', 'warn', 'debug'],
  });

  const redisConfig = process.env.REDIS_URL
    ? process.env.REDIS_URL
    : {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      };

  // Set up Bull Board for queue visualization
  const marketDataQueue = new Bull('market-data-collection', {
    redis: redisConfig,
  });

  const serverAdapter = new BullBoardExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  createBullBoard({
    queues: [new BullAdapter(marketDataQueue)],
    serverAdapter: serverAdapter,
  });

  app.use('/admin/queues', serverAdapter.getRouter());

  const port = process.env.PORT || 10000;

  await app.listen(port, '0.0.0.0');

  logger.log('🚀 Crypto Collector starting...');
  logger.log(`📡 Server listening on port ${port}`);
  logger.log('📊 Collecting data for: bitcoin, ethereum, solana');
  logger.log('⏱️  Collection interval: 5 minutes');

  const baseUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${port}`;
  logger.log(`📋 Bull Board dashboard available at: ${baseUrl}/admin/queues`);
  logger.log(`🏥 Health check available at: ${baseUrl}/health`);

  await app.init();

  logger.log('✅ Collector is running and will collect data periodically');

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  process.on('SIGTERM', async () => {
    logger.log('SIGTERM signal received: closing application');
    await app.close();
  });
}

bootstrap().catch((error) => {
  console.error('❌ Error starting application:', error);
  process.exit(1);
});
