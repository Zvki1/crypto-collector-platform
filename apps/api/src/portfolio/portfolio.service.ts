import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTransactionDto } from './dto/CreateTransaction.dto';
import { PrismaService } from '@app/database';

@Injectable()
export class PortfolioService {
  constructor(private readonly prisma: PrismaService) {}
  async getTransactions(userId: string) {
    const portfolio = await this.prisma.portfolio.findUnique({
      where: { userId },
      include: {
        transactions: {
          orderBy: { transactionDate: 'desc' },
          include: { cryptocurrency: { select: { name: true } } },
        },
      },
    });
    if (!portfolio) {
      throw new NotFoundException('portfolio introuvable');
    }
    return portfolio?.transactions;
  }

  // // // // // // // // // //
  // create transaction
  // // // // // // // // // //

  async createTransaction(
    createTransactionDto: CreateTransactionDto,
    userId: string,
  ) {
    const latestPrice = await this.prisma.marketData.findFirst({
      where: { cryptocurrencyId: createTransactionDto.cryptocurrencyId },
      orderBy: { timestamp: 'desc' },
      select: { currentPrice: true },
    });
    if (!latestPrice) {
      throw new NotFoundException('latestPrice de la crypto est introuvable');
    }
    console.log(latestPrice, 'latest');
    const portfolio = await this.prisma.portfolio.findUnique({
      where: { userId },
    });
    if (!portfolio) {
      throw new NotFoundException('portfolio introuvable');
    }
    const cryptoTotals = await this.getCryptoTotalsInPortfolio(
      portfolio.id,
      createTransactionDto.cryptocurrencyId,
    );
    console.log(cryptoTotals);
    if (
      createTransactionDto.type == 'SELL' &&
      cryptoTotals.totalBought - cryptoTotals.totalSold <
        createTransactionDto.amount
    ) {
      throw new BadRequestException(
        `Vous ne pouvez pas vendre plus que ce que vous possédez. ` +
          `Quantité actuelle ${cryptoTotals.totalBought - cryptoTotals.totalSold}`,
      );
    }
    const transaction = await this.prisma.transaction.create({
      data: {
        portfolioId: portfolio.id,
        type: createTransactionDto.type,
        amount: createTransactionDto.amount,
        cryptocurrencyId: createTransactionDto.cryptocurrencyId,
        price: latestPrice.currentPrice,
        totalValue:
          createTransactionDto.amount * Number(latestPrice.currentPrice),
      },
    });
    return transaction;
  }

  // // // // // // // // // //
  // get crypto sales summary
  // // // // // // // // // //

  private async getCryptoTotalsInPortfolio(
    portfolioId: string,
    cryptocurrencyId: string,
  ) {
    const buyAgg = await this.prisma.transaction.aggregate({
      where: { portfolioId, cryptocurrencyId, type: 'BUY' },
      _sum: { amount: true },
    });
    const sellAgg = await this.prisma.transaction.aggregate({
      where: { portfolioId, cryptocurrencyId, type: 'SELL' },
      _sum: { amount: true },
    });
    return {
      totalBought: Number(buyAgg._sum.amount) || 0,
      totalSold: Number(sellAgg._sum.amount) || 0,
    };
  }
}
