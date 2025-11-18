import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CoinGeckoMarketData } from 'apps/collector/types/coinGeckoMarketData';
import axios, { AxiosInstance } from 'axios';
import Bottleneck from 'bottleneck';

@Injectable()
export class CoingeckoClientService {
  private readonly logger = new Logger(CoingeckoClientService.name);
  private readonly httpClient: AxiosInstance;
  private readonly limiter: Bottleneck;
  private readonly apiUrl: string | undefined;

  constructor(private configService: ConfigService) {
    this.apiUrl = this.configService.get<string>('collector.coingecko.apiUrl');
    const rateLimitMs = this.configService.get<number>(
      'collector.coingecko.rateLimitMs',
    );

    // Rate limiter: 2 secondes entre chaque requête = ~30 req/min
    this.limiter = new Bottleneck({
      minTime: rateLimitMs,
      maxConcurrent: 1,
    });

    this.httpClient = axios.create({
      baseURL: this.apiUrl,
      timeout: 10000,
    });
  }

  /**
   * Récupère les données de marché pour une liste de cryptomonnaies
   */
  async fetchMarketData(cryptoIds: string[]): Promise<CoinGeckoMarketData[]> {
    try {
      const ids = cryptoIds.join(',');
      const url = `/coins/markets`;

      this.logger.log(`Fetching market data for: ${ids}`);

      const response = await this.limiter.schedule(() =>
        this.httpClient.get<CoinGeckoMarketData[]>(url, {
          params: {
            vs_currency: 'eur',
            ids,
            order: 'market_cap_desc',
            sparkline: false,
            price_change_percentage: '1h,24h',
          },
        }),
      );

      this.logger.log(`Successfully fetched ${response.data.length} cryptos`);
      return response.data;
    } catch (error) {
      this.logger.error(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        `Failed to fetch market data: ${error.message}`,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        error.stack,
      );
      throw error;
    }
  }
}
