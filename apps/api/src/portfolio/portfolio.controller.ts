import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth-guard.guard';
import { CreateTransactionDto } from './dto/CreateTransaction.dto';
import { UserId } from '../common/decorators/user-id.decorator';

@UseGuards(JwtAuthGuard)
@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get('transactions')
  async findTransactions(@UserId() userId: string) {
    return await this.portfolioService.getTransactions(userId);
  }
  @Get('holdings')
  async findHoldings(@UserId() userId: string) {
    return await this.portfolioService.getWalletHoldings(userId);
  }
  @Get('overview')
  async findOverview(@UserId() userId: string) {
    return this.portfolioService.getPortfolioOverview(userId);
  }
  @Post('transaction')
  async createTransaction(
    @UserId() userId: string,
    @Body() createTransactionDto: CreateTransactionDto,
  ) {
    console.log();

    return await this.portfolioService.createTransaction(
      createTransactionDto,
      userId,
    );
  }
}
