import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';
import { ConfigService } from '@nestjs/config';
import { AlertType } from '@prisma/client';

describe('EmailService', () => {
  let service: EmailService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string | number> = {
        SMTP_HOST: 'smtp.test.com',
        SMTP_PORT: 587,
        SMTP_USER: 'test@test.com',
        SMTP_PASSWORD: 'testpass',
        SMTP_FROM: 'noreply@test.com',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendAlertEmail', () => {
    it('should send alert email when price goes above target', async () => {
      const sendMailSpy = jest
        .spyOn(service['transporter'], 'sendMail')
        .mockResolvedValue({ messageId: 'test-123' } as any);

      await service.sendAlertEmail({
        userEmail: 'user@test.com',
        userName: 'Test User',
        cryptoSymbol: 'BTC',
        cryptoName: 'Bitcoin',
        alertType: AlertType.PRICE_ABOVE,
        targetPrice: 50000,
        currentPrice: 51000,
      });

      expect(sendMailSpy).toHaveBeenCalledTimes(1);
      expect(sendMailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@test.com',
          subject: 'Alerte Prix - BTC',
        }),
      );

      const callArgs = sendMailSpy.mock.calls[0][0];
      expect(callArgs.html).toContain('dépassé');
      expect(callArgs.html).toContain('Bitcoin');
    });

    it('should send alert email when price goes below target', async () => {
      const sendMailSpy = jest
        .spyOn(service['transporter'], 'sendMail')
        .mockResolvedValue({ messageId: 'test-213' } as any);

      await service.sendAlertEmail({
        userEmail: 'user@test.com',
        userName: 'Test User',
        cryptoSymbol: 'ETH',
        cryptoName: 'Ethereum',
        alertType: AlertType.PRICE_BELOW,
        targetPrice: 3000,
        currentPrice: 2900,
      });

      expect(sendMailSpy).toHaveBeenCalledTimes(1);
      expect(sendMailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@test.com',
          subject: 'Alerte Prix - ETH',
        }),
      );

      const callArgs = sendMailSpy.mock.calls[0][0];
      expect(callArgs.html).toContain('descendu sous');
      expect(callArgs.html).toContain('Ethereum');
    });

    it('should handle email sending errors', async () => {
      jest
        .spyOn(service['transporter'], 'sendMail')
        .mockRejectedValue(new Error('SMTP connection failed'));

      await expect(
        service.sendAlertEmail({
          userEmail: 'user@test.com',
          userName: 'Test User',
          cryptoSymbol: 'BTC',
          cryptoName: 'Bitcoin',
          alertType: AlertType.PRICE_ABOVE,
          targetPrice: 50000,
          currentPrice: 51000,
        }),
      ).rejects.toThrow('SMTP connection failed');
    });
  });
});
