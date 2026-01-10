import { Test, TestingModule } from '@nestjs/testing';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';
import { JwtService } from '@nestjs/jwt';

describe('AlertsController', () => {
  let controller: AlertsController;

  const mockAlertsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AlertsController],
      providers: [
        {
          provide: AlertsService,
          useValue: mockAlertsService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    controller = module.get<AlertsController>(AlertsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
