/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CryptosService } from './cryptos.service';
import { CreateCryptoDto } from './dto/create-crypto.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth-guard.guard';

@Controller('cryptos')
export class CryptosController {
  constructor(private readonly cryptosService: CryptosService) {}
  @Get()
  async findAll() {
    return this.cryptosService.findAll();
  }
  @Get('overview')
  findOverview() {
    return this.cryptosService.findOverview();
  }
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.cryptosService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(@Body() createCryptoDto: CreateCryptoDto) {
    return await this.cryptosService.create(createCryptoDto);
  }
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    return await this.cryptosService.delete(id);
  }
}
