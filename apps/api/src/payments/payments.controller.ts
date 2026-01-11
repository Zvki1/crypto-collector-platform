import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth-guard.guard';
import { UserId } from '../common/decorators/user-id.decorator';
import { CreateDepositDto } from './dto/create-deposit.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * Créer une session de dépôt Stripe
   * POST /payments/deposit
   */
  @UseGuards(JwtAuthGuard)
  @Post('deposit')
  async createDeposit(
    @UserId() userId: string,
    @Body() createDepositDto: CreateDepositDto,
  ) {
    return this.paymentsService.createDepositSession(
      userId,
      createDepositDto.amount,
    );
  }

  /**
   * Webhook Stripe pour confirmer les paiements
   * POST /payments/webhook
   */
  @Post('webhook')
  async handleWebhook(
    @Req() req: { rawBody: Buffer },
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new Error('Raw body is required for Stripe webhook');
    }
    return this.paymentsService.handleStripeWebhook(rawBody, signature);
  }

  /**
   * Vérifier le statut d'un dépôt
   * GET /payments/deposit/status?sessionId=xxx
   */
  @UseGuards(JwtAuthGuard)
  @Get('deposit/status')
  async checkDepositStatus(
    @UserId() userId: string,
    @Query('sessionId') sessionId: string,
  ) {
    return this.paymentsService.checkDepositStatus(sessionId, userId);
  }

  /**
   * Confirmer un dépôt manuellement (alternative au webhook)
   * POST /payments/deposit/confirm?sessionId=xxx
   */
  @UseGuards(JwtAuthGuard)
  @Post('deposit/confirm')
  async confirmDeposit(
    @UserId() userId: string,
    @Query('sessionId') sessionId: string,
  ) {
    return this.paymentsService.confirmDeposit(sessionId, userId);
  }

  /**
   * Récupérer l'historique des dépôts
   * GET /payments/deposits
   */
  @UseGuards(JwtAuthGuard)
  @Get('deposits')
  async getDeposits(@UserId() userId: string) {
    return this.paymentsService.getDeposits(userId);
  }

  /**
   * Récupérer le solde actuel
   * GET /payments/balance
   */
  @UseGuards(JwtAuthGuard)
  @Get('balance')
  async getBalance(@UserId() userId: string) {
    return this.paymentsService.getBalance(userId);
  }
}
