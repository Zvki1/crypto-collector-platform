/* eslint-disable @typescript-eslint/no-unsafe-member-access */
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

@UseGuards(JwtAuthGuard)
@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get('transactions')
  async findTransactions(@Request() req) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const userId = req?.user.sub;
    return await this.portfolioService.getTransactions(userId as string);
  }
  @Post('transaction')
  async createTransaction(
    @Request() req,
    @Body() createTransactionDto: CreateTransactionDto,
  ) {
    console.log();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const userId = req?.user.sub;
    return await this.portfolioService.createTransaction(
      createTransactionDto,
      userId as string,
    );
  }
}
