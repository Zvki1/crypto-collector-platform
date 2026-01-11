import { IsNumber, Min } from 'class-validator';

export class CreateDepositDto {
  @IsNumber()
  @Min(1, { message: 'Le montant minimum est de 1€' })
  amount: number;
}
