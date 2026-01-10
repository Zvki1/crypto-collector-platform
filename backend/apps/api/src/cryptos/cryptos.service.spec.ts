/* eslint-disable @typescript-eslint/unbound-method */
// apps/api/src/cryptos/cryptos.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { CryptosService } from './cryptos.service';
import { PrismaService } from 'backend/libs/database/src';
import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

describe('CryptosService', () => {
  let service: CryptosService;
  let prisma: PrismaService;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CryptosService,

        {
          provide: PrismaService,
          useValue: {
            cryptocurrency: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              findFirstOrThrow: jest.fn(),
              create: jest.fn(),
              delete: jest.fn(),
            },
            marketData: {
              deleteMany: jest.fn(),
            },
          },
        },

        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
            axiosRef: {
              get: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<CryptosService>(CryptosService);
    prisma = module.get<PrismaService>(PrismaService);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('devrait retourner un tableau', async () => {
      // Arrange
      const mockCryptos = [
        {
          id: '123',
          coingeckoId: 'bitcoin',
          symbol: 'BTC',
          name: 'Bitcoin',
          image: 'https://...',
          marketCapRank: 1,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          marketData: [{ price: 42000, timestamp: new Date() }],
        },
        {
          id: '456',
          coingeckoId: 'ethereum',
          symbol: 'ETH',
          name: 'Ethereum',
          image: 'https://...',
          marketCapRank: 2,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          marketData: [{ price: 2500, timestamp: new Date() }],
        },
      ];
      jest
        .spyOn(prisma.cryptocurrency, 'findMany')
        .mockResolvedValue(mockCryptos);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(2);
      expect(prisma.cryptocurrency.findMany).toHaveBeenCalledWith({
        include: {
          marketData: {
            orderBy: { timestamp: 'desc' },
            take: 1,
          },
        },
      });
    });
  });

  describe('findOne', () => {
    it('devrait retourner une crypto', async () => {
      // arrange
      const mockCrypto = {
        id: '123',
        coingeckoId: 'bitcoin',
        symbol: 'BTC',
        name: 'Bitcoin',
        image: 'https://...',
        marketCapRank: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        marketData: [{ price: 42000, timestamp: new Date() }],
      };
      jest
        .spyOn(prisma.cryptocurrency, 'findFirstOrThrow')
        .mockResolvedValue(mockCrypto);
      // act
      const result = await service.findOne('123');

      // assert
      expect(result).toBeDefined();
      expect(result).toEqual(mockCrypto);
      expect(result.coingeckoId).toBe('bitcoin');
      expect(prisma.cryptocurrency.findFirstOrThrow).toHaveBeenCalledWith({
        where: { id: '123' },
        include: {
          marketData: {
            orderBy: { timestamp: 'desc' },
            take: 1,
          },
        },
      });
    });

    it('devrait lancer NotFoundException si crypto inexistante', async () => {
      // Arrange
      jest
        .spyOn(prisma.cryptocurrency, 'findFirstOrThrow')
        .mockRejectedValue(new Error('Record not found'));
      // Act & Assert
      await expect(service.findOne('fake-id')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.cryptocurrency.findFirstOrThrow).toHaveBeenCalledWith({
        where: { id: 'fake-id' },
        include: {
          marketData: {
            orderBy: { timestamp: 'desc' },
            take: 1,
          },
        },
      });
    });
  });

  describe('delete', () => {
    it('devrait supprimer la crypto selon son id', async () => {
      // arrange
      const mockDeletedCrypto = {
        id: '123',
        coingeckoId: 'bitcoin',
        symbol: 'BTC',
        name: 'Bitcoin',
        image: 'https://...',
        marketCapRank: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        marketData: [{ price: 42000, timestamp: new Date() }],
      };
      jest
        .spyOn(prisma.cryptocurrency, 'delete')
        .mockResolvedValue(mockDeletedCrypto);
      // act
      const result = await service.delete(mockDeletedCrypto.id);
      // assert
      expect(result).toEqual(mockDeletedCrypto);
      expect(prisma.cryptocurrency.delete).toHaveBeenCalledWith({
        where: { id: mockDeletedCrypto.id },
      });
    });

    it('devrait lancer NotFoundException si crypto inexistante', async () => {
      // arrange
      const prismaError = new Error(
        'Record to delete does not exist.',
      ) as Error & { code: string };
      prismaError.code = 'P2025';

      jest
        .spyOn(prisma.cryptocurrency, 'delete')
        .mockRejectedValue(prismaError);
      // act & assert
      await expect(service.delete('fake-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('devrait créer une nouvelle crypto', async () => {
      // Arrange
      const createCryptoDto = {
        coingeckoId: 'bitcoin',
      };
      const mockCoinGeckoResponse = {
        id: 'bitcoin',
        symbol: 'btc',
        name: 'Bitcoin',
        image: {
          large:
            'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
        },
        market_cap_rank: 1,
      };
      const mockCreatedCrypto = {
        id: '123',
        coingeckoId: 'bitcoin',
        symbol: 'BTC',
        name: 'Bitcoin',
        image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
        marketCapRank: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // mocking methods
      jest.spyOn(prisma.cryptocurrency, 'findUnique').mockResolvedValue(null);
      jest
        .spyOn(httpService.axiosRef, 'get')
        .mockResolvedValue({ data: mockCoinGeckoResponse });
      jest
        .spyOn(prisma.cryptocurrency, 'create')
        .mockResolvedValue(mockCreatedCrypto);
      // Act
      // const cryptoExists = prisma.cryptocurrency.findUnique(
      //   createCryptoDto.coingeckoId,
      // );
      const result = await service.create(createCryptoDto);
      // Assert
      expect(result).toEqual(mockCreatedCrypto);
      expect(prisma.cryptocurrency.findUnique).toHaveBeenCalledWith({
        where: { coingeckoId: createCryptoDto.coingeckoId },
      });
    });

    it('devrait lancer ConflictException si crypto existe déjà', async () => {
      // Arrange
      const createCryptoDto = {
        coingeckoId: 'bitcoin',
      };
      const mockExistingCrypto = {
        id: '123',
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
        .mockResolvedValue(mockExistingCrypto);
      // Act & Assert
      await expect(service.create(createCryptoDto)).rejects.toThrow(
        ConflictException,
      );
      expect(prisma.cryptocurrency.findUnique).toHaveBeenCalledWith({
        where: { coingeckoId: createCryptoDto.coingeckoId },
      });
    });

    it('devrait lancer BadRequestException si données CoinGecko invalides', async () => {
      // Arrange
      const createCryptoDto = {
        coingeckoId: 'bitcoin',
      };
      jest.spyOn(prisma.cryptocurrency, 'findUnique').mockResolvedValue(null);
      const axiosError = {
        response: { status: 404 },
        message: 'Request failed with status code 404',
      };

      jest.spyOn(httpService.axiosRef, 'get').mockRejectedValue(axiosError);
      // Act & Assert
      await expect(service.create(createCryptoDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
