import { Test, TestingModule } from '@nestjs/testing';
import { MarketDataService } from './market-data.service';
import { PrismaService } from 'backend/libs/database/src';
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

      // Mock Decimal implementation for test
      const Decimal = (value: number | null) => {
        if (value === null || value === undefined) return 0;
        return value;
      };

      const mockMarketDataArray = [
        {
          id: '987fcdeb-51a2-3bc4-d567-890123456789',
          createdAt: new Date('2025-11-28'),
          cryptocurrencyId: '123e4567-e89b-12d3-a456-426614174000',
          currentPrice: Decimal(43250.5),
          high24h: Decimal(43890.0),
          low24h: Decimal(42100.0),
          priceChange24h: Decimal(150.5),
          priceChangePercentage24h: Decimal(2.45),
          priceChangePercentage1h: Decimal(0.1),
          priceChangePercentage7d: Decimal(5.0),
          priceChangePercentage14d: Decimal(10.0),
          priceChangePercentage30d: Decimal(20.0),
          priceChangePercentage60d: Decimal(30.0),
          priceChangePercentage200d: Decimal(40.0),
          priceChangePercentage1y: Decimal(50.0),
          marketCap: Decimal(845000000000),
          marketCapChange24h: Decimal(1000000000),
          marketCapChangePercentage24h: Decimal(0.5),
          fullyDilutedValuation: Decimal(900000000000),
          totalVolume: Decimal(28000000000),
          circulatingSupply: Decimal(19000000),
          totalSupply: Decimal(21000000),
          maxSupply: Decimal(21000000),
          ath: Decimal(69000),
          athChangePercentage: Decimal(-37.3),
          athDate: new Date('2021-11-10'),
          atl: Decimal(67.81),
          atlChangePercentage: Decimal(63700),
          atlDate: new Date('2013-07-06'),
          lastUpdated: new Date('2025-11-28'),
          timestamp: new Date('2025-11-28'),
        },
        {
          id: '876edcba-42b1-4ac5-c678-901234567890',
          createdAt: new Date('2025-11-27'),
          cryptocurrencyId: '123e4567-e89b-12d3-a456-426614174000',
          currentPrice: Decimal(42800.0),
          high24h: Decimal(43500.0),
          low24h: Decimal(41900.0),
          priceChange24h: Decimal(120.0),
          priceChangePercentage24h: Decimal(1.85),
          priceChangePercentage1h: Decimal(0.05),
          priceChangePercentage7d: Decimal(4.0),
          priceChangePercentage14d: Decimal(8.0),
          priceChangePercentage30d: Decimal(15.0),
          priceChangePercentage60d: Decimal(25.0),
          priceChangePercentage200d: Decimal(35.0),
          priceChangePercentage1y: Decimal(45.0),
          marketCap: Decimal(840000000000),
          marketCapChange24h: Decimal(900000000),
          marketCapChangePercentage24h: Decimal(0.4),
          fullyDilutedValuation: Decimal(880000000000),
          totalVolume: Decimal(27000000000),
          circulatingSupply: Decimal(18900000),
          totalSupply: Decimal(21000000),
          maxSupply: Decimal(21000000),
          ath: Decimal(69000),
          athChangePercentage: Decimal(-38.0),
          athDate: new Date('2021-11-10'),
          atl: Decimal(67.81),
          atlChangePercentage: Decimal(63700),
          atlDate: new Date('2013-07-06'),
          lastUpdated: new Date('2025-11-27'),
          timestamp: new Date('2025-11-27'),
        },
      ];
      jest.spyOn(prisma.cryptocurrency, 'findUnique').mockResolvedValue({
        id: mockCrypto.id,
        name: mockCrypto.name,
        symbol: mockCrypto.symbol,
        image: mockCrypto.image,
      } as any);
      jest
        .spyOn(prisma.marketData, 'findMany')
        .mockResolvedValue(mockMarketDataArray as any);
      // act
      const result = await service.findByCryptoID(mockCrypto.id);
      // assert
      expect(result).toEqual({
        marketData: mockMarketDataArray,
        crypto: {
          id: mockCrypto.id,
          name: mockCrypto.name,
          symbol: mockCrypto.symbol,
          image: mockCrypto.image,
        },
      });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(prisma.cryptocurrency.findUnique).toHaveBeenCalledWith({
        where: {
          id: mockCrypto.id,
        },
        select: {
          id: true,
          name: true,
          symbol: true,
          image: true,
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
      // Mock Decimal implementation for test
      const Decimal = (value: number | null) => {
        // Return a dummy object or a number, but never null
        if (value === null || value === undefined) return 0;
        return value;
      };

      const mockMarketData = {
        id: '987fcdeb-51a2-3bc4-d567-890123456789',
        createdAt: new Date(),
        cryptocurrencyId: '123e4567-e89b-12d3-a456-426614174000',
        currentPrice: Decimal(43250.5),
        high24h: Decimal(43890.0),
        low24h: Decimal(42100.0),
        priceChange24h: Decimal(100.0),
        priceChangePercentage24h: Decimal(2.45),
        priceChangePercentage1h: Decimal(0.1),
        priceChangePercentage7d: Decimal(5.0),
        priceChangePercentage14d: Decimal(10.0),
        priceChangePercentage30d: Decimal(20.0),
        priceChangePercentage60d: Decimal(30.0),
        priceChangePercentage200d: Decimal(40.0),
        priceChangePercentage1y: Decimal(50.0),
        marketCap: Decimal(845000000000),
        marketCapChange24h: Decimal(1000000000),
        marketCapChangePercentage24h: Decimal(0.5),
        fullyDilutedValuation: Decimal(900000000000),
        totalVolume: Decimal(28000000000),
        circulatingSupply: Decimal(19000000),
        totalSupply: Decimal(21000000),
        maxSupply: Decimal(21000000),
        ath: Decimal(69000),
        athChangePercentage: Decimal(-37.3),
        athDate: new Date('2021-11-10'),
        atl: Decimal(67.81),
        atlChangePercentage: Decimal(63700),
        atlDate: new Date('2013-07-06'),
        lastUpdated: new Date(),
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
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(prisma.cryptocurrency.findUnique).toHaveBeenCalledWith({
        where: {
          id: mockCrypto.id,
        },
      });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(prisma.marketData.findFirst).toHaveBeenCalledWith({
        where: { cryptocurrencyId: mockCrypto.id },
        orderBy: {
          timestamp: 'desc',
        },
        include: {
          cryptocurrency: {
            select: {
              symbol: true,
              name: true,
              image: true,
            },
          },
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
