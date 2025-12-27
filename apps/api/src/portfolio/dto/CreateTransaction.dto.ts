import { TransactionType } from '@prisma/client';
import { IsEnum, IsNumber, IsUUID, Min } from 'class-validator';

export class CreateTransactionDto {
  @IsEnum(TransactionType)
  type: TransactionType;
  @IsUUID()
  cryptocurrencyId: string;
  @IsNumber()
  @Min(0.0001)
  amount: number;
  @IsNumber()
  @Min(0.0001)
  price: number;
}
