import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@app/database';
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, username, password } = registerDto;
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Cet email est déjà utilisé');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.usersService.create({
      email,
      username,
      password: hashedPassword,
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    await this.prisma.portfolio.create({
      data: {
        userId: user.id,
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = user;
    return result;
  }

  async validateUser(email: string, password: string) {
    const existingUser = await this.usersService.findByEmail(email);
    if (!existingUser) {
      return null;
    }
    const isMatch = await bcrypt.compare(password, existingUser.password);
    if (!isMatch) {
      return null;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...userWhithoutPassword } = existingUser;
      return userWhithoutPassword;
    }
  }

  async login(loginDto: LoginDto) {
    const validUser = await this.validateUser(
      loginDto.email,
      loginDto.password,
    );
    if (!validUser) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }
    const payload = {
      sub: validUser.id,
      email: validUser.email,
      username: validUser.username,
      role: validUser.role,
    };
    const access_token = await this.jwtService.signAsync(payload);
    return {
      access_token,
      user: validUser,
    };
  }
}
