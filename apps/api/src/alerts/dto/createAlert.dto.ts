import { AlertType } from '@prisma/client';
import { IsEnum, IsNumber, IsUUID } from 'class-validator';

export class CreateAlertDto {
  @IsUUID()
  cryptocurrencyId: string;
  @IsEnum(AlertType)
  type: AlertType;
  @IsNumber()
  targetPrice: number;
}
