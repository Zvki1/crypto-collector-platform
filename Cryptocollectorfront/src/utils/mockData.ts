export interface Cryptocurrency {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  logo: string;
}

export const mockCryptos: Cryptocurrency[] = [
  {
    id: 'bitcoin',
    symbol: 'BTC',
    name: 'Bitcoin',
    price: 43250.50,
    change24h: 2.45,
    marketCap: 845000000000,
    volume24h: 28000000000,
    high24h: 43890.00,
    low24h: 42100.00,
    logo: '₿',
  },
  {
    id: 'ethereum',
    symbol: 'ETH',
    name: 'Ethereum',
    price: 2280.75,
    change24h: -1.23,
    marketCap: 274000000000,
    volume24h: 15000000000,
    high24h: 2320.00,
    low24h: 2250.00,
    logo: 'Ξ',
  },
  {
    id: 'binancecoin',
    symbol: 'BNB',
    name: 'Binance Coin',
    price: 315.80,
    change24h: 3.67,
    marketCap: 48000000000,
    volume24h: 1200000000,
    high24h: 320.00,
    low24h: 305.00,
    logo: 'B',
  },
  {
    id: 'solana',
    symbol: 'SOL',
    name: 'Solana',
    price: 98.45,
    change24h: 5.12,
    marketCap: 42000000000,
    volume24h: 2100000000,
    high24h: 102.00,
    low24h: 93.50,
    logo: 'S',
  },
  {
    id: 'cardano',
    symbol: 'ADA',
    name: 'Cardano',
    price: 0.52,
    change24h: -0.85,
    marketCap: 18000000000,
    volume24h: 450000000,
    high24h: 0.53,
    low24h: 0.51,
    logo: 'A',
  },
  {
    id: 'ripple',
    symbol: 'XRP',
    name: 'Ripple',
    price: 0.61,
    change24h: 1.95,
    marketCap: 33000000000,
    volume24h: 980000000,
    high24h: 0.62,
    low24h: 0.60,
    logo: 'X',
  },
  {
    id: 'polkadot',
    symbol: 'DOT',
    name: 'Polkadot',
    price: 7.25,
    change24h: -2.34,
    marketCap: 9500000000,
    volume24h: 320000000,
    high24h: 7.45,
    low24h: 7.10,
    logo: 'D',
  },
  {
    id: 'avalanche',
    symbol: 'AVAX',
    name: 'Avalanche',
    price: 36.80,
    change24h: 4.21,
    marketCap: 13500000000,
    volume24h: 580000000,
    high24h: 37.50,
    low24h: 35.20,
    logo: 'A',
  },
];

export const generatePriceHistory = (currentPrice: number, days: number) => {
  const data = [];
  let price = currentPrice * 0.9;
  const volatility = 0.02;

  for (let i = 0; i < days; i++) {
    const change = (Math.random() - 0.5) * 2 * volatility;
    price = price * (1 + change);
    
    const high = price * (1 + Math.random() * 0.01);
    const low = price * (1 - Math.random() * 0.01);
    const open = i === 0 ? price : data[i - 1].close;
    const close = price;

    data.push({
      date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      price: Math.round(price * 100) / 100,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume: Math.round((Math.random() * 500000000 + 100000000) / 1000000),
    });
  }

  return data;
};

export const formatNumber = (num: number): string => {
  if (num >= 1e9) {
    return (num / 1e9).toFixed(2) + ' Mrd';
  } else if (num >= 1e6) {
    return (num / 1e6).toFixed(2) + ' M';
  } else if (num >= 1e3) {
    return (num / 1e3).toFixed(2) + ' k';
  }
  return num.toFixed(2);
};

export const formatCurrency = (num: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(num);
};

export const formatPercent = (num: number): string => {
  return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`;
};
