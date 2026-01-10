import { registerAs } from '@nestjs/config';

export default registerAs('collector', () => ({
  coingecko: {
    apiUrl: process.env.COINGECKO_API_URL || 'https://api.coingecko.com/api/v3',
    rateLimitMs: parseInt(process.env.COINGECKO_RATE_LIMIT_MS || '2000', 10),
  },
  cryptoIds: (
    process.env.COLLECTOR_CRYPTO_IDS || 'bitcoin,ethereum,solana'
  ).split(','),
  intervalMinutes: parseInt(process.env.COLLECTOR_INTERVAL_MINUTES || '5', 10),
}));
