import { Test, TestingModule } from '@nestjs/testing';
import { CryptosController } from './cryptos.controller';

describe('CryptoController', () => {
  let controller: CryptosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CryptosController],
    }).compile();

    controller = module.get<CryptosController>(CryptosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
