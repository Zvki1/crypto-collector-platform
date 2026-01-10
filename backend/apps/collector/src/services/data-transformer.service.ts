import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CoinGeckoMarketData } from '../../types/coinGeckoMarketData';

@Injectable()
export class DataTransformerService {
  private readonly logger = new Logger(DataTransformerService.name);

  /**
   * Transforme les données API en entité Cryptocurrency
   */
  transformToCryptocurrency(
    apiData: CoinGeckoMarketData,
  ): Prisma.CryptocurrencyCreateInput {
    return {
      coingeckoId: apiData.id,
      symbol: apiData.symbol.toUpperCase(),
      name: apiData.name,
      image: apiData.image,
      marketCapRank: apiData.market_cap_rank,
      isActive: true,
    };
  }

  /**
   * Transforme les données API en entité MarketData
   */
  transformToMarketData(
    apiData: CoinGeckoMarketData,
    cryptocurrencyId: string,
  ): Prisma.MarketDataCreateInput {
    return {
      cryptocurrency: {
        connect: { id: cryptocurrencyId },
      },
      currentPrice: new Prisma.Decimal(apiData.current_price),
      high24h: apiData.high_24h ? new Prisma.Decimal(apiData.high_24h) : null,
      low24h: apiData.low_24h ? new Prisma.Decimal(apiData.low_24h) : null,
      priceChange24h: apiData.price_change_24h
        ? new Prisma.Decimal(apiData.price_change_24h)
        : null,
      priceChangePercentage24h: apiData.price_change_percentage_24h
        ? new Prisma.Decimal(apiData.price_change_percentage_24h)
        : null,
      priceChangePercentage1h: apiData.price_change_percentage_1h_in_currency
        ? new Prisma.Decimal(apiData.price_change_percentage_1h_in_currency)
        : null,
      marketCap: apiData.market_cap
        ? new Prisma.Decimal(apiData.market_cap)
        : null,
      fullyDilutedValuation: apiData.fully_diluted_valuation
        ? new Prisma.Decimal(apiData.fully_diluted_valuation)
        : null,
      totalVolume: apiData.total_volume
        ? new Prisma.Decimal(apiData.total_volume)
        : null,
      marketCapChange24h: apiData.market_cap_change_24h
        ? new Prisma.Decimal(apiData.market_cap_change_24h)
        : null,
      marketCapChangePercentage24h: apiData.market_cap_change_percentage_24h
        ? new Prisma.Decimal(apiData.market_cap_change_percentage_24h)
        : null,
      circulatingSupply: apiData.circulating_supply
        ? new Prisma.Decimal(apiData.circulating_supply)
        : null,
      totalSupply: apiData.total_supply
        ? new Prisma.Decimal(apiData.total_supply)
        : null,
      maxSupply: apiData.max_supply
        ? new Prisma.Decimal(apiData.max_supply)
        : null,
      ath: apiData.ath ? new Prisma.Decimal(apiData.ath) : null,
      athChangePercentage: apiData.ath_change_percentage
        ? new Prisma.Decimal(apiData.ath_change_percentage)
        : null,
      athDate: apiData.ath_date ? new Date(apiData.ath_date) : null,
      atl: apiData.atl ? new Prisma.Decimal(apiData.atl) : null,
      atlChangePercentage: apiData.atl_change_percentage
        ? new Prisma.Decimal(apiData.atl_change_percentage)
        : null,
      atlDate: apiData.atl_date ? new Date(apiData.atl_date) : null,
      timestamp: new Date(apiData.last_updated),
    };
  }
}
