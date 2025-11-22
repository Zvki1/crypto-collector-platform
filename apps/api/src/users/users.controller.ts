// apps/api/src/users/users.controller.ts
import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth-guard.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Request() req) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    console.log('User from JWT:', req.user);
    // req.user = { sub: "uuid", email: "...", username: "..." }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    return this.usersService.findById(req.user.sub);
  }
}
