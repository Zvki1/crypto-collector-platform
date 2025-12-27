import { Injectable, NotFoundException } from '@nestjs/common';
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
  async createTransaction(
    createTransactionDto: CreateTransactionDto,
    userId: string,
  ) {
    const crypto = await this.prisma.cryptocurrency.findUnique({
      where: { id: createTransactionDto.cryptocurrencyId },
    });
    if (!crypto) {
      throw new NotFoundException('crypto introuvable');
    }
    const portfolio = await this.prisma.portfolio.findUnique({
      where: { userId },
    });
    if (!portfolio) {
      throw new NotFoundException('portfolio introuvable');
    }
    const transaction = await this.prisma.transaction.create({
      data: {
        portfolioId: portfolio.id,
        type: createTransactionDto.type,
        amount: createTransactionDto.amount,
        cryptocurrencyId: createTransactionDto.cryptocurrencyId,
        price: createTransactionDto.price,
        totalValue: createTransactionDto.amount * createTransactionDto.price,
      },
    });
    return transaction;
  }
}
