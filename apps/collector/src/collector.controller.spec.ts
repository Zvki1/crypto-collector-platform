import { Test, TestingModule } from '@nestjs/testing';
import { CollectorController } from './collector.controller';
import { CollectorService } from './collector.service';

describe('CollectorController', () => {
  let collectorController: CollectorController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [CollectorController],
      providers: [CollectorService],
    }).compile();

    collectorController = app.get<CollectorController>(CollectorController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(collectorController.getHello()).toBe('Hello World!');
    });
  });
});
