import { Test, TestingModule } from '@nestjs/testing';
import { MarketDataService } from './market-data.service';
import { PrismaService } from '@app/database';
import { NotFoundException } from '@nestjs/common';

describe('MarketDataService', () => {
  let service: MarketDataService;
  let prisma: PrismaService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketDataService,
        {
          provide: PrismaService,
          useValue: {
            marketData: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
            },
            cryptocurrency: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();
    prisma = module.get<PrismaService>(PrismaService);
    service = module.get<MarketDataService>(MarketDataService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  describe('findByCryptoID', () => {
    it('should return a dataMarket objet', async () => {
      // arrange
      const mockCrypto = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        coingeckoId: 'bitcoin',
        symbol: 'BTC',
        name: 'Bitcoin',
        image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
        marketCapRank: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockMarketDataArray = [
        {
          id: '987fcdeb-51a2-3bc4-d567-890123456789',
          cryptocurrencyId: '123e4567-e89b-12d3-a456-426614174000',
          currentPrice: 43250.5,
          marketCap: 845000000000,
          totalVolume: 28000000000,
          high24h: 43890.0,
          low24h: 42100.0,
          priceChangePercentage24h: 2.45,
          timestamp: new Date('2025-11-28'),
        },
        {
          id: '876edcba-42b1-4ac5-c678-901234567890',
          cryptocurrencyId: '123e4567-e89b-12d3-a456-426614174000',
          currentPrice: 42800.0,
          marketCap: 840000000000,
          totalVolume: 27000000000,
          high24h: 43500.0,
          low24h: 41900.0,
          priceChangePercentage24h: 1.85,
          timestamp: new Date('2025-11-27'),
        },
      ];
      jest
        .spyOn(prisma.cryptocurrency, 'findUnique')
        .mockResolvedValue(mockCrypto);
      jest
        .spyOn(prisma.marketData, 'findMany')
        .mockResolvedValue(mockMarketDataArray);
      // act
      const result = await service.findByCryptoID(mockCrypto.id);
      // assert
      expect(result).toEqual(mockMarketDataArray);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(prisma.cryptocurrency.findUnique).toHaveBeenCalledWith({
        where: {
          id: mockCrypto.id,
        },
      });
    });
    it('should throw NotFoundException if crypto not found', async () => {
      // arrange
      jest.spyOn(prisma.cryptocurrency, 'findUnique').mockResolvedValue(null);
      // act + assert
      await expect(service.findByCryptoID('fake-if')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
  describe('findLatest', () => {
    it('should return a single marketData object ', async () => {
      // arrange
      const mockMarketData = {
        id: '987fcdeb-51a2-3bc4-d567-890123456789',
        cryptocurrencyId: '123e4567-e89b-12d3-a456-426614174000',
        currentPrice: 43250.5,
        marketCap: 845000000000,
        totalVolume: 28000000000,
        high24h: 43890.0,
        low24h: 42100.0,
        priceChangePercentage24h: 2.45,
        timestamp: new Date(),
      };
      const mockCrypto = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        coingeckoId: 'bitcoin',
        symbol: 'BTC',
        name: 'Bitcoin',
        image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
        marketCapRank: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      jest
        .spyOn(prisma.cryptocurrency, 'findUnique')
        .mockResolvedValue(mockCrypto);
      jest
        .spyOn(prisma.marketData, 'findFirst')
        .mockResolvedValue(mockMarketData);
      // act
      const result = await service.findLatest(mockCrypto.id);
      // assert
      expect(result).toEqual(mockMarketData);
      expect(prisma.cryptocurrency.findUnique).toHaveBeenCalledWith({
        where: {
          id: mockCrypto.id,
        },
      });
      expect(prisma.marketData.findFirst).toHaveBeenCalledWith({
        where: { cryptocurrencyId: mockCrypto.id },
        orderBy: {
          timestamp: 'desc',
        },
      });
    });
    it('should throw NotFoundException if crypto not found', async () => {
      // arrange
      jest.spyOn(prisma.cryptocurrency, 'findUnique').mockResolvedValue(null);
      // act + assert
      await expect(service.findLatest('fake-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if no marketData found', async () => {
      // arrange
      const mockCrypto = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        coingeckoId: 'bitcoin',
        symbol: 'BTC',
        name: 'Bitcoin',
        image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
        marketCapRank: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      jest
        .spyOn(prisma.cryptocurrency, 'findUnique')
        .mockResolvedValue(mockCrypto);
      jest.spyOn(prisma.marketData, 'findFirst').mockResolvedValue(null);
      // act +assert
      await expect(service.findLatest(mockCrypto.id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
