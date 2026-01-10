import { Test, TestingModule } from '@nestjs/testing';
import { CryptosController } from './cryptos.controller';
import { CryptosService } from './cryptos.service';
import { JwtService } from '@nestjs/jwt';

describe('CryptoController', () => {
  let controller: CryptosController;

  const mockCryptosService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByCoinGeckoId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CryptosController],
      providers: [
        {
          provide: CryptosService,
          useValue: mockCryptosService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    controller = module.get<CryptosController>(CryptosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
