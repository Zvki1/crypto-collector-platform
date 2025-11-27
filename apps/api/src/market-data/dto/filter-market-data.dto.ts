import { IsString, IsNumberString, IsOptional, IsUUID } from 'class-validator';
import type { UUID } from 'crypto';

export class FilterMarketDataDto {
  @IsString()
  @IsUUID()
  cryptoId: UUID;
  @IsOptional()
  @IsNumberString()
  days?: string;
}
