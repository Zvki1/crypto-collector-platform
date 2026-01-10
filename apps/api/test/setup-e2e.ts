import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;
let sharedCrypto: any = null;
let sharedMarketData: any = null;

export const setupTestDatabase = async () => {
  // Use TEST_DATABASE_URL env var, or fallback to dedicated test database
  const testDatabaseUrl =
    process.env.TEST_DATABASE_URL ||
    'postgresql://crypto_user:crypto_password_dev@localhost:5432/crypto_test';

  prisma = new PrismaClient({
    datasources: {
      db: {
        url: testDatabaseUrl,
      },
    },
  });

  await cleanDatabase();

  // Always use upsert to get or create shared crypto (works across test files)
  sharedCrypto = await prisma.cryptocurrency.upsert({
    where: { coingeckoId: 'bitcoin' },
    update: {},
    create: {
      coingeckoId: 'bitcoin',
      symbol: 'BTC',
      name: 'Bitcoin',
      image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
      marketCapRank: 1,
      isActive: true,
    },
  });

  // Ensure market data exists for shared crypto (delete old, create fresh)
  await prisma.marketData.deleteMany({
    where: { cryptocurrencyId: sharedCrypto.id },
  });

  sharedMarketData = await prisma.marketData.create({
    data: {
      cryptocurrencyId: sharedCrypto.id,
      currentPrice: 50000,
      high24h: 51000,
      low24h: 49000,
      priceChange24h: 500,
      priceChangePercentage24h: 1.0,
      marketCap: 1000000000000,
      totalVolume: 50000000000,
      circulatingSupply: 19000000,
      totalSupply: 21000000,
      maxSupply: 21000000,
      ath: 69000,
      athChangePercentage: -27.5,
      athDate: new Date('2021-11-10'),
      atl: 67.81,
      atlChangePercentage: 73600,
      atlDate: new Date('2013-07-06'),
      timestamp: new Date(),
    },
  });

  return prisma;
};

export const cleanDatabase = async () => {
  if (!prisma) {
    prisma = new PrismaClient();
  }

  // Clean user-specific data only (cheap to recreate)
  await prisma.transaction.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.portfolio.deleteMany();
  await prisma.user.deleteMany();

  // KEEP crypto AND market data (expensive fixtures, shared across tests)
  // Market data is needed for price calculations in portfolio/alerts
  // This prevents foreign key violations and improves test performance
};

export const teardownTestDatabase = async () => {
  if (prisma) {
    await prisma.$disconnect();
  }
};

// Get or create shared crypto fixture (used across all tests)
export const getOrCreateTestCrypto = async () => {
  if (!prisma) {
    prisma = new PrismaClient();
  }

  // Return cached instance if available
  if (sharedCrypto) {
    return sharedCrypto;
  }

  // Use upsert to avoid unique constraint errors
  sharedCrypto = await prisma.cryptocurrency.upsert({
    where: { coingeckoId: 'bitcoin' },
    update: {},
    create: {
      coingeckoId: 'bitcoin',
      symbol: 'BTC',
      name: 'Bitcoin',
      image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
      marketCapRank: 1,
      isActive: true,
    },
  });

  return sharedCrypto;
};

// Legacy function for backward compatibility
export const createTestCrypto = async () => {
  return getOrCreateTestCrypto();
};

export const createTestMarketData = async (cryptocurrencyId: string) => {
  // Delete existing market data for this crypto to avoid stale data
  await prisma.marketData.deleteMany({
    where: { cryptocurrencyId },
  });

  // Create fresh market data
  return await prisma.marketData.create({
    data: {
      cryptocurrencyId,
      currentPrice: 50000,
      high24h: 51000,
      low24h: 49000,
      priceChange24h: 500,
      priceChangePercentage24h: 1.0,
      marketCap: 1000000000000,
      totalVolume: 50000000000,
      circulatingSupply: 19000000,
      totalSupply: 21000000,
      maxSupply: 21000000,
      ath: 69000,
      athChangePercentage: -27.5,
      athDate: new Date('2021-11-10'),
      atl: 67.81,
      atlChangePercentage: 73600,
      atlDate: new Date('2013-07-06'),
      timestamp: new Date(),
    },
  });
};
