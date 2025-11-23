/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { PrismaService } from '@app/database';
import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCryptoDto } from './dto/create-crypto.dto';
import { firstValueFrom } from 'rxjs';
@Injectable()
export class CryptosService {
  constructor(
    private prisma: PrismaService,
    private httpService: HttpService,
  ) {}
  //   findAll method
  async findAll() {
    const cryptos = await this.prisma.cryptocurrency.findMany({
      include: {
        marketData: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
    });
    return cryptos;
  }
  //   findById method
  async findOne(id: string) {
    try {
      return await this.prisma.cryptocurrency.findFirstOrThrow({
        where: { id },
        include: {
          marketData: {
            orderBy: { timestamp: 'desc' },
            take: 1,
          },
        },
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      throw new NotFoundException('Crypto non trouvee');
    }
  }

  //   add crypto for admin only
  async create(createCryptoDto: CreateCryptoDto) {
    const cryptoExists = await this.prisma.cryptocurrency.findUnique({
      where: { coingeckoId: createCryptoDto.coingeckoId },
    });
    if (cryptoExists) {
      throw new ConflictException(
        `Cette crypto ${createCryptoDto.coingeckoId} est déjà trackée`,
      );
    }
    try {
      // 1. Fetch CoinGecko (peut échouer si crypto inexistante)
      const response = await firstValueFrom(
        this.httpService.get(
          `https://api.coingecko.com/api/v3/coins/${createCryptoDto.coingeckoId}`,
        ),
      );

      const coinData = response.data;

      // 2. Créer en BDD (séparé du catch)
      return await this.prisma.cryptocurrency.create({
        data: {
          coingeckoId: coinData.id,
          symbol: coinData.symbol.toUpperCase(),
          name: coinData.name,
          image: coinData.image?.large || null,
          marketCapRank: coinData.market_cap_rank,
        },
      });
    } catch (error) {
      // Distinguer les erreurs HTTP (CoinGecko) des erreurs BDD
      if (error.response?.status === 404) {
        throw new BadRequestException(
          `Crypto "${createCryptoDto.coingeckoId}" introuvable sur CoinGecko`,
        );
      }

      // Autres erreurs (réseau, BDD, etc.)
      throw new BadRequestException(
        `Erreur lors de l'ajout de la crypto: ${error.message}`,
      );
    }
  }
  async delete(id: string) {
    try {
      return await this.prisma.cryptocurrency.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Crypto avec l'id ${id} introuvable`);
      }
      throw error;
    }
  }
}
