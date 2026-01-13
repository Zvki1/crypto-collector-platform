import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@app/database';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private stripe: Stripe | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const stripeKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (stripeKey && stripeKey.startsWith('sk_')) {
      this.stripe = new Stripe(stripeKey);
    } else {
      console.warn('⚠️  Stripe non configuré - Les paiements sont désactivés');
    }
  }

  /**
   * Crée une session de paiement Stripe pour déposer de l'argent
   */
  async createDepositSession(userId: string, amount: number) {
    if (!this.stripe) {
      throw new BadRequestException(
        'Les paiements Stripe ne sont pas configurés',
      );
    }

    if (amount < 1) {
      throw new BadRequestException('Le montant minimum est de 1€');
    }

    const portfolio = await this.prisma.portfolio.findUnique({
      where: { userId },
    });

    if (!portfolio) {
      throw new NotFoundException('Portfolio introuvable');
    }

    // Créer un enregistrement de dépôt en attente
    const deposit = await this.prisma.deposit.create({
      data: {
        portfolioId: portfolio.id,
        amount,
        status: 'PENDING',
      },
    });

    // Créer la session Stripe Checkout
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Dépôt de fonds',
              description: `Ajout de ${amount}€ à votre portefeuille crypto`,
            },
            unit_amount: Math.round(amount * 100), // Stripe utilise les centimes
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${this.configService.get<string>('FRONTEND_URL')}/portfolio?deposit=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${this.configService.get<string>('FRONTEND_URL')}/portfolio?deposit=cancelled`,
      metadata: {
        depositId: deposit.id,
        userId,
      },
    });

    // Mettre à jour le dépôt avec l'ID de session Stripe
    await this.prisma.deposit.update({
      where: { id: deposit.id },
      data: { stripeSessionId: session.id },
    });

    return {
      sessionId: session.id,
      url: session.url,
    };
  }

  /**
   * Gère le webhook Stripe pour confirmer les paiements
   */
  async handleStripeWebhook(payload: Buffer, signature: string) {
    if (!this.stripe) {
      throw new BadRequestException(
        'Les paiements Stripe ne sont pas configurés',
      );
    }

    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret || '',
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      throw new BadRequestException(`Webhook Error: ${message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      await this.completeDeposit(session);
    }

    return { received: true };
  }

  /**
   * Complète un dépôt après confirmation du paiement
   */
  private async completeDeposit(session: Stripe.Checkout.Session) {
    const deposit = await this.prisma.deposit.findUnique({
      where: { stripeSessionId: session.id },
    });

    if (!deposit || deposit.status !== 'PENDING') {
      return;
    }

    // Transaction pour mettre à jour le dépôt et le solde du portfolio
    await this.prisma.$transaction(async (tx) => {
      // Marquer le dépôt comme complété
      await tx.deposit.update({
        where: { id: deposit.id },
        data: {
          status: 'COMPLETED',
          stripePaymentId: session.payment_intent as string,
          completedAt: new Date(),
        },
      });

      // Ajouter le montant au solde du portfolio
      await tx.portfolio.update({
        where: { id: deposit.portfolioId },
        data: {
          balance: {
            increment: deposit.amount,
          },
        },
      });
    });
  }

  /**
   * Vérifie le statut d'un dépôt via l'ID de session
   */
  async checkDepositStatus(sessionId: string, userId: string) {
    const deposit = await this.prisma.deposit.findUnique({
      where: { stripeSessionId: sessionId },
      include: {
        portfolio: true,
      },
    });

    if (!deposit || deposit.portfolio.userId !== userId) {
      throw new NotFoundException('Dépôt introuvable');
    }

    return {
      status: deposit.status,
      amount: deposit.amount,
      completedAt: deposit.completedAt,
    };
  }

  /**
   * Confirme un dépôt en vérifiant directement auprès de Stripe
   * (Alternative au webhook - utile en développement local)
   */
  async confirmDeposit(sessionId: string, userId: string) {
    if (!this.stripe) {
      throw new BadRequestException(
        'Les paiements Stripe ne sont pas configurés',
      );
    }

    // Vérifier que le dépôt existe et appartient à l'utilisateur
    const deposit = await this.prisma.deposit.findUnique({
      where: { stripeSessionId: sessionId },
      include: {
        portfolio: true,
      },
    });

    if (!deposit || deposit.portfolio.userId !== userId) {
      throw new NotFoundException('Dépôt introuvable');
    }

    // Si déjà complété, retourner le statut
    if (deposit.status === 'COMPLETED') {
      return {
        status: deposit.status,
        amount: deposit.amount,
        message: 'Dépôt déjà confirmé',
      };
    }

    // Vérifier le statut de la session auprès de Stripe
    const session = await this.stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return {
        status: deposit.status,
        amount: deposit.amount,
        message: 'Paiement non complété',
        stripeStatus: session.payment_status,
      };
    }

    // Le paiement est confirmé, mettre à jour le dépôt et le solde
    await this.prisma.$transaction(async (tx) => {
      await tx.deposit.update({
        where: { id: deposit.id },
        data: {
          status: 'COMPLETED',
          stripePaymentId: session.payment_intent as string,
          completedAt: new Date(),
        },
      });

      await tx.portfolio.update({
        where: { id: deposit.portfolioId },
        data: {
          balance: {
            increment: deposit.amount,
          },
        },
      });
    });

    return {
      status: 'COMPLETED',
      amount: deposit.amount,
      message: 'Dépôt confirmé avec succès',
    };
  }

  /**
   * Récupère l'historique des dépôts d'un utilisateur
   */
  async getDeposits(userId: string) {
    const portfolio = await this.prisma.portfolio.findUnique({
      where: { userId },
    });

    if (!portfolio) {
      throw new NotFoundException('Portfolio introuvable');
    }

    return this.prisma.deposit.findMany({
      where: { portfolioId: portfolio.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Récupère le solde actuel du portfolio
   */
  async getBalance(userId: string) {
    const portfolio = await this.prisma.portfolio.findUnique({
      where: { userId },
      select: { balance: true },
    });

    if (!portfolio) {
      throw new NotFoundException('Portfolio introuvable');
    }

    return { balance: Number(portfolio.balance) };
  }
}
