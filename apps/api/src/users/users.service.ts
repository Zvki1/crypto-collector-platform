import { Injectable } from '@nestjs/common';
import { PrismaService } from 'libs/database/src';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    email: string;
    username: string;
    password: string;
  }): Promise<User> {
    const { email, username, password } = data;
    const user = await this.prisma.user.create({
      data: {
        email,
        username,
        password,
      },
    });
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    return user;
  }

  async findById(id: string): Promise<Omit<User, 'password'> | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) return null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...sterilizedUser } = user;
    return sterilizedUser;
  }
}
