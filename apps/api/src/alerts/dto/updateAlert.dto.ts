import { AlertType } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';

export class UpdateAlertDto {
  @IsEnum(AlertType)
  @IsOptional()
  type?: AlertType;

  @IsNumber()
  @IsOptional()
  targetPrice?: number;
}
