import { Test, TestingModule } from '@nestjs/testing';
import { AlertCheckerProcessor } from './alert-checker.processor';
import { PrismaService } from 'backend/libs/database/src';
import { getQueueToken } from '@nestjs/bull';
import { AlertStatus, AlertType } from '@prisma/client';
import { Job } from 'bull';
import { Decimal } from '@prisma/client/runtime/library';

describe('AlertCheckerProcessor', () => {
  let processor: AlertCheckerProcessor;

  const mockPrismaService = {
    alert: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockEmailQueue = {
    add: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertCheckerProcessor,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: getQueueToken('email-notifications'),
          useValue: mockEmailQueue,
        },
      ],
    }).compile();

    processor = module.get<AlertCheckerProcessor>(AlertCheckerProcessor);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('checkAlerts', () => {
    it('should return zero counts when no active alerts exist', async () => {
      mockPrismaService.alert.findMany.mockResolvedValue([]);

      const job = {
        data: { cryptoId: 'crypto-123', currentPrice: 50000 },
      } as Job<{ cryptoId: string; currentPrice: number }>;

      const result = await processor.checkAlerts(job);

      expect(result).toEqual({ checked: 0, triggered: 0 });
      expect(mockPrismaService.alert.findMany).toHaveBeenCalledWith({
        where: {
          cryptocurrencyId: 'crypto-123',
          status: AlertStatus.ACTIVE,
        },
        include: {
          user: true,
          cryptocurrency: true,
        },
      });
    });

    it('should trigger PRICE_ABOVE alert when price exceeds target', async () => {
      const mockAlert = {
        id: 'alert-1',
        type: AlertType.PRICE_ABOVE,
        targetPrice: new Decimal(50000),
        user: {
          email: 'user@test.com',
          username: 'testuser',
        },
        cryptocurrency: {
          symbol: 'BTC',
          name: 'Bitcoin',
        },
      };

      mockPrismaService.alert.findMany.mockResolvedValue([mockAlert]);
      mockPrismaService.alert.update.mockResolvedValue(mockAlert);
      mockEmailQueue.add.mockResolvedValue({});

      const job = {
        data: { cryptoId: 'crypto-123', currentPrice: 51000 },
      } as Job<{ cryptoId: string; currentPrice: number }>;

      const result = await processor.checkAlerts(job);

      expect(result).toEqual({ checked: 1, triggered: 1 });
      expect(mockPrismaService.alert.update).toHaveBeenCalledWith({
        where: { id: 'alert-1' },
        data: {
          status: AlertStatus.TRIGGERED,
          triggeredAt: expect.any(Date),
        },
      });
      expect(mockEmailQueue.add).toHaveBeenCalledWith('send-alert', {
        alertId: 'alert-1',
        userEmail: 'user@test.com',
        userName: 'testuser',
        cryptoSymbol: 'BTC',
        cryptoName: 'Bitcoin',
        targetPrice: 50000,
        currentPrice: 51000,
        alertType: AlertType.PRICE_ABOVE,
      });
    });

    it('should trigger PRICE_BELOW alert when price falls below target', async () => {
      const mockAlert = {
        id: 'alert-2',
        type: AlertType.PRICE_BELOW,
        targetPrice: new Decimal(50000),
        user: {
          email: 'user@test.com',
          username: 'testuser',
        },
        cryptocurrency: {
          symbol: 'BTC',
          name: 'Bitcoin',
        },
      };

      mockPrismaService.alert.findMany.mockResolvedValue([mockAlert]);
      mockPrismaService.alert.update.mockResolvedValue(mockAlert);
      mockEmailQueue.add.mockResolvedValue({});

      const job = {
        data: { cryptoId: 'crypto-123', currentPrice: 49000 },
      } as Job<{ cryptoId: string; currentPrice: number }>;

      const result = await processor.checkAlerts(job);

      expect(result).toEqual({ checked: 1, triggered: 1 });
      expect(mockPrismaService.alert.update).toHaveBeenCalled();
      expect(mockEmailQueue.add).toHaveBeenCalled();
    });

    it('should not trigger alert when condition not met', async () => {
      const mockAlert = {
        id: 'alert-3',
        type: AlertType.PRICE_ABOVE,
        targetPrice: new Decimal(50000),
        user: {
          email: 'user@test.com',
          username: 'testuser',
        },
        cryptocurrency: {
          symbol: 'BTC',
          name: 'Bitcoin',
        },
      };

      mockPrismaService.alert.findMany.mockResolvedValue([mockAlert]);

      const job = {
        data: { cryptoId: 'crypto-123', currentPrice: 49000 },
      } as Job<{ cryptoId: string; currentPrice: number }>;

      const result = await processor.checkAlerts(job);

      expect(result).toEqual({ checked: 1, triggered: 0 });
      expect(mockPrismaService.alert.update).not.toHaveBeenCalled();
      expect(mockEmailQueue.add).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      mockPrismaService.alert.findMany.mockRejectedValue(
        new Error('Database connection failed'),
      );

      const job = {
        data: { cryptoId: 'crypto-123', currentPrice: 50000 },
      } as Job<{ cryptoId: string; currentPrice: number }>;

      await expect(processor.checkAlerts(job)).rejects.toThrow(
        'Database connection failed',
      );
    });
  });
});
