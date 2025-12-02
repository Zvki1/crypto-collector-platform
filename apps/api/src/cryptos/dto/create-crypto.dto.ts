import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCryptoDto {
  @IsNotEmpty()
  @IsString()
  coingeckoId: string;
}
