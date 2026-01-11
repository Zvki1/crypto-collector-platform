import { Test, TestingModule } from '@nestjs/testing';
import { PortfolioService } from './portfolio.service';
import { PrismaService } from 'libs/database/src';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('PortfolioService', () => {
  let service: PortfolioService;
  let prisma: PrismaService;

  const mockPrismaService = {
    portfolio: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    transaction: {
      findMany: jest.fn(),
      create: jest.fn(),
      groupBy: jest.fn(),
      aggregate: jest.fn(),
    },
    cryptocurrency: {
      findMany: jest.fn(),
    },
    marketData: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortfolioService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PortfolioService>(PortfolioService);
    prisma = module.get<PrismaService>(PrismaService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTransactions', () => {
    it('should return transactions for a user', async () => {
      const mockTransactions = [
        {
          id: 'tx-1',
          type: 'BUY',
          amount: 1.5,
          price: 50000,
          totalValue: 75000,
          transactionDate: new Date(),
          cryptocurrency: { name: 'Bitcoin' },
        },
      ];

      const mockPortfolio = {
        id: 'portfolio-1',
        userId: 'user-1',
        transactions: mockTransactions,
      };

      jest
        .spyOn(prisma.portfolio, 'findUnique')
        .mockResolvedValue(mockPortfolio as any);

      const result = await service.getTransactions('user-1');

      expect(result).toEqual(mockTransactions);
      expect(prisma.portfolio.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: {
          transactions: {
            orderBy: { transactionDate: 'desc' },
            include: { cryptocurrency: { select: { name: true } } },
          },
        },
      });
    });

    it('should throw NotFoundException if portfolio not found', async () => {
      jest.spyOn(prisma.portfolio, 'findUnique').mockResolvedValue(null);

      await expect(service.getTransactions('user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createTransaction', () => {
    const createTransactionDto = {
      type: 'BUY' as const,
      amount: 1,
      cryptocurrencyId: 'crypto-1',
    };

    it('should create a BUY transaction successfully', async () => {
      const mockLatestPrice = { currentPrice: 50000 };
      const mockPortfolio = {
        id: 'portfolio-1',
        userId: 'user-1',
        balance: 100000,
      };
      const mockBuyAgg = { _sum: { amount: 0 } };
      const mockSellAgg = { _sum: { amount: 0 } };
      const mockTransaction = {
        id: 'tx-1',
        type: 'BUY',
        amount: 1,
        price: 50000,
        totalValue: 50000,
        portfolioId: 'portfolio-1',
        cryptocurrencyId: 'crypto-1',
        createdAt: new Date(),
      };

      jest
        .spyOn(prisma.marketData, 'findFirst')
        .mockResolvedValue(mockLatestPrice as any);
      jest
        .spyOn(prisma.portfolio, 'findUnique')
        .mockResolvedValue(mockPortfolio as any);
      jest
        .spyOn(prisma.transaction, 'aggregate')
        .mockResolvedValueOnce(mockBuyAgg as any)
        .mockResolvedValueOnce(mockSellAgg as any);

      jest
        .spyOn(prisma, '$transaction')
        .mockImplementation(async (callback: any) => {
          const txContext = {
            transaction: {
              create: jest.fn().mockResolvedValue(mockTransaction),
            },
            portfolio: {
              update: jest
                .fn()
                .mockResolvedValue({ ...mockPortfolio, balance: 50000 }),
            },
          };
          return callback(txContext);
        });

      const result = await service.createTransaction(
        createTransactionDto,
        'user-1',
      );

      expect(result).toBeDefined();
      expect(result.type).toEqual('BUY');
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException if latest price not found', async () => {
      jest.spyOn(prisma.marketData, 'findFirst').mockResolvedValue(null);

      await expect(
        service.createTransaction(createTransactionDto, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if portfolio not found', async () => {
      const mockLatestPrice = { currentPrice: 50000 };
      jest
        .spyOn(prisma.marketData, 'findFirst')
        .mockResolvedValue(mockLatestPrice as any);
      jest.spyOn(prisma.portfolio, 'findUnique').mockResolvedValue(null);

      await expect(
        service.createTransaction(createTransactionDto, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when trying to sell more than owned', async () => {
      const sellDto = {
        type: 'SELL' as const,
        amount: 10,
        cryptocurrencyId: 'crypto-1',
      };

      const mockLatestPrice = { currentPrice: 50000 };
      const mockPortfolio = { id: 'portfolio-1', userId: 'user-1' };
      const mockBuyAgg = { _sum: { amount: 5 } };
      const mockSellAgg = { _sum: { amount: 0 } };

      jest
        .spyOn(prisma.marketData, 'findFirst')
        .mockResolvedValue(mockLatestPrice as any);
      jest
        .spyOn(prisma.portfolio, 'findUnique')
        .mockResolvedValue(mockPortfolio as any);
      jest
        .spyOn(prisma.transaction, 'aggregate')
        .mockResolvedValueOnce(mockBuyAgg as any)
        .mockResolvedValueOnce(mockSellAgg as any);

      await expect(
        service.createTransaction(sellDto, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getPortfolioOverview', () => {
    it('should return portfolio overview with total value and ROI', async () => {
      const mockPortfolio = { id: 'portfolio-1', userId: 'user-1' };
      const mockTransactions = [{ cryptocurrencyId: 'crypto-1' }];
      const mockCryptoInfos = [
        { id: 'crypto-1', name: 'Bitcoin', symbol: 'BTC', image: 'btc.png' },
      ];
      const mockMarketData = [
        { cryptocurrencyId: 'crypto-1', currentPrice: 50000 },
      ];
      const mockBuyAgg = { _sum: { amount: 2 } };
      const mockSellAgg = { _sum: { amount: 0 } };
      const mockBoughtTransactions = [{ totalValue: 90000 }];

      jest
        .spyOn(prisma.portfolio, 'findUnique')
        .mockResolvedValue(mockPortfolio as any);
      jest
        .spyOn(prisma.transaction, 'groupBy')
        .mockResolvedValue(mockTransactions as any);
      jest
        .spyOn(prisma.cryptocurrency, 'findMany')
        .mockResolvedValue(mockCryptoInfos as any);
      jest
        .spyOn(prisma.marketData, 'findMany')
        .mockResolvedValue(mockMarketData as any);
      jest
        .spyOn(prisma.transaction, 'aggregate')
        .mockResolvedValue(mockBuyAgg as any)
        .mockResolvedValue(mockSellAgg as any);
      jest
        .spyOn(prisma.transaction, 'findMany')
        .mockResolvedValue(mockBoughtTransactions as any);

      const result = await service.getPortfolioOverview('user-1');

      expect(result).toHaveProperty('totalValue');
      expect(result).toHaveProperty('totalInvested');
      expect(result).toHaveProperty('pl');
      expect(result).toHaveProperty('roi');
      expect(result.totalInvested).toBe(90000);
      expect(typeof result.totalValue).toBe('number');
      expect(typeof result.pl).toBe('number');
      expect(typeof result.roi).toBe('number');
    });
  });
});
