import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(3)
  @MaxLength(20)
  username: string;

  @IsString()
  @MinLength(8)
  @Matches(/(?=.*[a-z])/, {
    message: 'Le mot de passe doit contenir au moins une minuscule',
  })
  @Matches(/(?=.*[A-Z])/, {
    message: 'Le mot de passe doit contenir au moins une majuscule',
  })
  @Matches(/(?=.*\d)/, {
    message: 'Le mot de passe doit contenir au moins un chiffre',
  })
  password: string;
}
