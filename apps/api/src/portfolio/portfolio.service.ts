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
  // get wallet Holdings
  // // // // // // // // // //
  async getWalletHoldings(userId: string) {
    const portfolio = await this.prisma.portfolio.findUnique({
      where: { userId },
    });

    const transactions = await this.prisma.transaction.groupBy({
      by: ['cryptocurrencyId'],
      where: { portfolioId: portfolio?.id },
    });
    // les ids des cryptos en transactions
    const cryptoIds = transactions.map((t) => t.cryptocurrencyId);
    // recuperations des informations des c cryptos
    const cryptoInfos = await this.prisma.cryptocurrency.findMany({
      where: { id: { in: cryptoIds } },
      select: { name: true, image: true, symbol: true, id: true },
    });
    // console.log(cryptoInfos);
    const latestMarketData = await this.prisma.marketData.findMany({
      where: { cryptocurrencyId: { in: cryptoIds } },
      orderBy: { timestamp: 'desc' },
      distinct: ['cryptocurrencyId'],
      select: {
        cryptocurrencyId: true,
        currentPrice: true,
      },
    });
    // console.log(latestMarketData);
    const results = await Promise.all(
      transactions.map(async (crypto) => {
        const totals = await this.getCryptoTotalsInPortfolio(
          portfolio?.id as string,
          crypto.cryptocurrencyId,
        );

        return {
          quantity: totals.totalBought - totals.totalSold,
          crypto: crypto.cryptocurrencyId,
        };
      }),
    );
    const finalResult = results.map((r) => {
      const info = cryptoInfos.find((info) => info.id === r.crypto);
      const currentPrice = latestMarketData.find(
        (currentPrice) => currentPrice.cryptocurrencyId === info?.id,
      );
      console.log(currentPrice);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { crypto, cryptocurrencyId, ...rest } = {
        ...info,
        ...r,
        ...currentPrice,
      };
      return rest;
    });

    return finalResult;
  }
  // // // // // // // // // //
  // getCryptoTotalsInPortfolio
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
