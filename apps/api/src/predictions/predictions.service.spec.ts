import { Test, TestingModule } from '@nestjs/testing';
import { PredictionsService } from './predictions.service';
import { PrismaService } from 'libs/database/src';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('PredictionsService', () => {
  let service: PredictionsService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PredictionsService,
        {
          provide: PrismaService,
          useValue: {
            cryptocurrency: {
              findUnique: jest.fn(),
            },
            marketData: {
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<PredictionsService>(PredictionsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('devrait être défini', () => {
    expect(service).toBeDefined();
  });

  describe('generateForecast - Validation des périodes', () => {
    it('devrait rejeter une période invalide (50 jours)', async () => {
      // Arrange
      const cryptoId = 'test-crypto-id';
      const invalidPeriod = 50; //  Période non supportée

      // Act & Assert
      await expect(
        service.generateForecast(cryptoId, invalidPeriod),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.generateForecast(cryptoId, invalidPeriod),
      ).rejects.toThrow('Période invalide. Choisissez parmi : 7, 14, 30 jours');
    });

    it('devrait accepter les périodes valides (7, 14, 30)', async () => {
      // Arrange : données mockées
      const cryptoId = 'test-crypto-id';
      const mockCrypto = {
        id: cryptoId,
        name: 'Bitcoin',
        symbol: 'BTC',
        coingeckoId: 'bitcoin',
      };

      // On crée 30 jours de données fictives
      const mockHistoricalData = Array.from({ length: 30 }, (_, i) => ({
        currentPrice: 30000 + i * 100, // Prix qui augmente légèrement
        timestamp: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
      }));

      // Mock des appels Prisma
      jest
        .spyOn(prismaService.cryptocurrency, 'findUnique')
        .mockResolvedValue(mockCrypto as any);
      jest
        .spyOn(prismaService.marketData, 'findMany')
        .mockResolvedValue(mockHistoricalData as any);

      // Act & Assert : tester les 3 périodes valides
      for (const period of [7, 14, 30]) {
        const result = await service.generateForecast(cryptoId, period);
        expect(result.forecast.forecastPeriod).toBe(period);
        expect(result.forecast.predictions).toHaveLength(period);
      }
    });
  });

  describe('generateForecast - Génération de prévisions', () => {
    it('devrait générer des prévisions pour 7 jours', async () => {
      // Arrange
      const cryptoId = 'test-crypto-id';
      const mockCrypto = {
        id: cryptoId,
        name: 'Bitcoin',
        symbol: 'BTC',
        coingeckoId: 'bitcoin',
      };

      // Créer 30 jours de données avec une tendance haussière
      const mockHistoricalData = Array.from({ length: 30 }, (_, i) => ({
        currentPrice: 30000 + i * 50, // +50€ par jour
        timestamp: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
      }));

      jest
        .spyOn(prismaService.cryptocurrency, 'findUnique')
        .mockResolvedValue(mockCrypto as any);
      jest
        .spyOn(prismaService.marketData, 'findMany')
        .mockResolvedValue(mockHistoricalData as any);

      // Act
      const result = await service.generateForecast(cryptoId, 7);

      // Assert
      expect(result).toBeDefined();
      expect(result.crypto.name).toBe('Bitcoin');
      expect(result.forecast.model).toBe('Simple Moving Average (SMA)');
      expect(result.forecast.predictions).toHaveLength(7);

      // Vérifier la structure de chaque prévision
      result.forecast.predictions.forEach((prediction) => {
        expect(prediction).toHaveProperty('date');
        expect(prediction).toHaveProperty('predictedPrice');
        expect(prediction).toHaveProperty('confidence');
        expect(prediction.predictedPrice).toBeGreaterThan(0);
        expect(prediction.confidence).toBeGreaterThan(0);
        expect(prediction.confidence).toBeLessThanOrEqual(1);
      });

      // Vérifier que la confiance diminue
      const firstConfidence = result.forecast.predictions[0].confidence;
      const lastConfidence = result.forecast.predictions[6].confidence;
      expect(firstConfidence).toBeGreaterThan(lastConfidence);
    });
  });

  describe('generateForecast - Gestion des erreurs', () => {
    it("devrait lancer une erreur si la crypto n'existe pas", async () => {
      // Arrange
      const cryptoId = 'crypto-inexistante';
      jest
        .spyOn(prismaService.cryptocurrency, 'findUnique')
        .mockResolvedValue(null);

      // Act & Assert
      await expect(service.generateForecast(cryptoId, 7)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('devrait lancer une erreur si pas assez de données historiques', async () => {
      // Arrange
      const cryptoId = 'test-crypto-id';
      const mockCrypto = {
        id: cryptoId,
        name: 'Bitcoin',
        symbol: 'BTC',
        coingeckoId: 'bitcoin',
      };

      // Seulement 3 jours de données (insuffisant)
      const mockHistoricalData = Array.from({ length: 3 }, (_, i) => ({
        currentPrice: 30000,
        timestamp: new Date(Date.now() - (2 - i) * 24 * 60 * 60 * 1000),
      }));

      jest
        .spyOn(prismaService.cryptocurrency, 'findUnique')
        .mockResolvedValue(mockCrypto as any);
      jest
        .spyOn(prismaService.marketData, 'findMany')
        .mockResolvedValue(mockHistoricalData as any);

      // Act & Assert
      await expect(service.generateForecast(cryptoId, 7)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.generateForecast(cryptoId, 7)).rejects.toThrow(
        'Pas assez de données historiques',
      );
    });
  });
});
