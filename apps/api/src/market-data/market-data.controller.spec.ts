import { Test, TestingModule } from '@nestjs/testing';
import { MarketDataController } from './market-data.controller';
import { MarketDataService } from './market-data.service';

describe('MarketDataController', () => {
  let controller: MarketDataController;

  const mockMarketDataService = {
    findByCryptoID: jest.fn(),
    findLatest: jest.fn(),
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MarketDataController],
      providers: [
        {
          provide: MarketDataService,
          useValue: mockMarketDataService,
        },
      ],
    }).compile();

    controller = module.get<MarketDataController>(MarketDataController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
