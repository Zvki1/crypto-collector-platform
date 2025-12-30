import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';
import { AlertType } from '@prisma/client';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: Number(this.configService.get('SMTP_PORT')),
      secure: true,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASSWORD'),
      },
    });
  }

  async sendAlertEmail(params: {
    userEmail: string;
    userName: string;
    cryptoSymbol: string;
    cryptoName: string;
    alertType: AlertType;
    targetPrice: number;
    currentPrice: number;
  }) {
    const {
      userEmail,
      userName,
      cryptoSymbol,
      cryptoName,
      alertType,
      targetPrice,
      currentPrice,
    } = params;

    const condition =
      alertType === AlertType.PRICE_ABOVE ? 'dépassé' : 'descendu sous';

    const subject = `Alerte Prix - ${cryptoSymbol.toUpperCase()}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Alerte Déclenchée</h1>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <p>Bonjour <strong>${userName}</strong>,</p>
          
          <p>Votre alerte pour <strong>${cryptoName} (${cryptoSymbol.toUpperCase()})</strong> a été déclenchée !</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Prix cible :</strong> $${targetPrice.toFixed(2)}</p>
            <p style="margin: 5px 0;"><strong>Prix actuel :</strong> $${currentPrice.toFixed(2)}</p>
            <p style="margin: 5px 0;"><strong>Condition :</strong> Prix ${condition} le seuil</p>
          </div>
           <div style="text-align: center; margin: 30px 0;">
        <a
          href="http://localhost:3001/portefeuille"
          style="
            display: inline-block;
            background-color: #667eea;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
          "
          target="_blank"
        >
          Accéder à mon portefeuille
        </a>
      </div>
          <p style="color: #666; font-size: 12px;">
            Cette alerte a été automatiquement désactivée.
          </p>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
          <p>Crypto Market Alert System</p>
        </div>
      </body>
      </html>
    `;

    try {
      await this.transporter.sendMail({
        from: '"Alertes Cryptos" <noreply@cryptoCollectorapp.com>',
        to: userEmail,
        subject,
        html,
      });

      this.logger.log(`✅ Email sent to ${userEmail}`);
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`❌ Failed to send email to ${userEmail}: ${errorMsg}`);
      throw error;
    }
  }
}
