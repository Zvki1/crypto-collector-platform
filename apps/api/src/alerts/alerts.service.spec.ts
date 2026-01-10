import { Test, TestingModule } from '@nestjs/testing';
import { AlertsService } from './alerts.service';
import { PrismaService } from 'libs/database/src';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AlertStatus } from '@prisma/client';

describe('AlertsService', () => {
  let service: AlertsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    alert: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AlertsService>(AlertsService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('CreateAlert', () => {
    it('should create an alert successfully', async () => {
      const createAlertDto = {
        cryptocurrencyId: 'crypto-1',
        type: 'ABOVE' as const,
        targetPrice: 50000,
      };

      const mockAlert = {
        id: 'alert-1',
        userId: 'user-1',
        ...createAlertDto,
        status: AlertStatus.ACTIVE,
        cryptocurrency: { id: 'crypto-1', name: 'Bitcoin' },
        createdAt: new Date(),
      };

      jest.spyOn(prisma.alert, 'count').mockResolvedValue(5);
      jest.spyOn(prisma.alert, 'create').mockResolvedValue(mockAlert as any);

      const result = await service.CreateAlert('user-1', createAlertDto);

      expect(result).toEqual(mockAlert);
      expect(prisma.alert.count).toHaveBeenCalledWith({
        where: { userId: 'user-1', status: AlertStatus.ACTIVE },
      });
    });

    it('should throw BadRequestException if user has 10+ active alerts', async () => {
      const createAlertDto = {
        cryptocurrencyId: 'crypto-1',
        type: 'ABOVE' as const,
        targetPrice: 50000,
      };

      jest.spyOn(prisma.alert, 'count').mockResolvedValue(10);

      await expect(
        service.CreateAlert('user-1', createAlertDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getAlerts', () => {
    it('should return all alerts for a user', async () => {
      const mockAlerts = [
        {
          id: 'alert-1',
          userId: 'user-1',
          cryptocurrencyId: 'crypto-1',
          type: 'ABOVE',
          targetPrice: 50000,
          cryptocurrency: { id: 'crypto-1', name: 'Bitcoin' },
        },
      ];

      jest.spyOn(prisma.alert, 'findMany').mockResolvedValue(mockAlerts as any);

      const result = await service.getAlerts('user-1');

      expect(result).toEqual(mockAlerts);
      expect(prisma.alert.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: { cryptocurrency: true },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('deleteAlert', () => {
    it('should delete an alert successfully', async () => {
      const mockAlert = {
        id: 'alert-1',
        userId: 'user-1',
      };

      jest.spyOn(prisma.alert, 'delete').mockResolvedValue(mockAlert as any);

      const result = await service.deleteAlert('alert-1', 'user-1');

      expect(result).toEqual(mockAlert);
      expect(prisma.alert.delete).toHaveBeenCalledWith({
        where: { id: 'alert-1', userId: 'user-1' },
      });
    });

    it('should throw NotFoundException if alert not found', async () => {
      jest.spyOn(prisma.alert, 'delete').mockRejectedValue({ code: 'P2025' });

      await expect(service.deleteAlert('alert-1', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
