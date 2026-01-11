import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { TrendingUp, Info } from 'lucide-react';
import { mockCryptos, generatePriceHistory } from '../utils/mockData';

export default function AnalysisPage() {
  const [selectedCrypto, setSelectedCrypto] = useState('bitcoin');
  const [indicators, setIndicators] = useState({
    sma20: true,
    sma50: false,
    ema: false,
    bollinger: false,
    rsi: false,
    macd: false,
  });

  const crypto = mockCryptos.find(c => c.id === selectedCrypto) || mockCryptos[0];
  const priceHistory = useMemo(() => generatePriceHistory(crypto.price, 90), [crypto.price]);

  // Calculate technical indicators
  const calculateSMA = (data: any[], period: number) => {
    return data.map((item, index) => {
      if (index < period - 1) return { ...item, [`sma${period}`]: null };
      const sum = data.slice(index - period + 1, index + 1).reduce((acc, d) => acc + d.price, 0);
      return { ...item, [`sma${period}`]: sum / period };
    });
  };

  const calculateEMA = (data: any[], period: number = 20) => {
    const multiplier = 2 / (period + 1);
    let ema = data[0].price;
    
    return data.map((item, index) => {
      if (index === 0) {
        return { ...item, ema };
      }
      ema = (item.price - ema) * multiplier + ema;
      return { ...item, ema };
    });
  };

  const calculateBollinger = (data: any[], period: number = 20) => {
    return data.map((item, index) => {
      if (index < period - 1) {
        return { ...item, bollingerUpper: null, bollingerLower: null, bollingerMiddle: null };
      }
      
      const slice = data.slice(index - period + 1, index + 1);
      const sma = slice.reduce((acc, d) => acc + d.price, 0) / period;
      const variance = slice.reduce((acc, d) => acc + Math.pow(d.price - sma, 2), 0) / period;
      const stdDev = Math.sqrt(variance);
      
      return {
        ...item,
        bollingerMiddle: sma,
        bollingerUpper: sma + (stdDev * 2),
        bollingerLower: sma - (stdDev * 2),
      };
    });
  };

  const calculateRSI = (data: any[], period: number = 14) => {
    return data.map((item, index) => {
      if (index < period) return { ...item, rsi: 50 };
      
      const changes = data.slice(index - period, index).map((d, i, arr) => {
        if (i === 0) return 0;
        return d.price - arr[i - 1].price;
      });
      
      const gains = changes.filter(c => c > 0).reduce((a, b) => a + b, 0) / period;
      const losses = Math.abs(changes.filter(c => c < 0).reduce((a, b) => a + b, 0)) / period;
      
      const rs = losses === 0 ? 100 : gains / losses;
      const rsi = 100 - (100 / (1 + rs));
      
      return { ...item, rsi };
    });
  };

  const calculateMACD = (data: any[]) => {
    const ema12 = calculateEMA(data, 12);
    const ema26 = calculateEMA(data, 26);
    
    return data.map((item, index) => {
      const macd = (ema12[index] as any).ema - (ema26[index] as any).ema;
      return { ...item, macd: macd * 10 }; // Scaled for visibility
    });
  };

  let chartData = [...priceHistory];

  if (indicators.sma20) {
    chartData = calculateSMA(chartData, 20);
  }
  if (indicators.sma50) {
    chartData = calculateSMA(chartData, 50);
  }
  if (indicators.ema) {
    chartData = calculateEMA(chartData);
  }
  if (indicators.bollinger) {
    chartData = calculateBollinger(chartData);
  }
  if (indicators.rsi) {
    chartData = calculateRSI(chartData);
  }
  if (indicators.macd) {
    chartData = calculateMACD(chartData);
  }

  const indicatorInfo = {
    sma20: {
      name: 'Moyenne Mobile Simple (20)',
      description: 'Moyenne du prix sur les 20 dernières périodes. Aide à identifier la tendance générale.',
      interpretation: 'Prix au-dessus = tendance haussière, en dessous = tendance baissière.',
    },
    sma50: {
      name: 'Moyenne Mobile Simple (50)',
      description: 'Moyenne du prix sur les 50 dernières périodes. Plus stable que la SMA 20.',
      interpretation: 'Croisement avec SMA 20 peut signaler un changement de tendance.',
    },
    ema: {
      name: 'Moyenne Mobile Exponentielle',
      description: 'Donne plus de poids aux prix récents. Réagit plus rapidement aux changements.',
      interpretation: 'Utile pour détecter les retournements de tendance précoces.',
    },
    bollinger: {
      name: 'Bandes de Bollinger',
      description: 'Enveloppe de volatilité autour de la moyenne mobile. Mesure la volatilité du marché.',
      interpretation: 'Prix près des bandes supérieures = surachat, inférieures = survente.',
    },
    rsi: {
      name: 'RSI (Relative Strength Index)',
      description: 'Oscillateur de momentum variant de 0 à 100. Mesure la vitesse des mouvements de prix.',
      interpretation: 'RSI > 70 = surachat, RSI < 30 = survente.',
    },
    macd: {
      name: 'MACD (Moving Average Convergence Divergence)',
      description: 'Indicateur de momentum basé sur la différence entre deux moyennes mobiles.',
      interpretation: 'Croisement au-dessus de 0 = signal d\'achat, en dessous = signal de vente.',
    },
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-slate-900 mb-1">Analyse technique</h1>
        <p className="text-slate-600">Indicateurs et outils d'analyse avancés</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Indicators Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Indicateurs</CardTitle>
            <CardDescription>Sélectionnez les indicateurs à afficher</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="crypto" className="mb-2 block">Cryptomonnaie</Label>
              <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mockCryptos.map((crypto) => (
                    <SelectItem key={crypto.id} value={crypto.id}>
                      {crypto.logo} {crypto.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-start gap-2">
                <Checkbox
                  id="sma20"
                  checked={indicators.sma20}
                  onCheckedChange={(checked) => setIndicators({ ...indicators, sma20: !!checked })}
                />
                <div className="space-y-1">
                  <Label htmlFor="sma20" className="cursor-pointer">SMA 20</Label>
                  <p className="text-slate-500">Moyenne mobile simple</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Checkbox
                  id="sma50"
                  checked={indicators.sma50}
                  onCheckedChange={(checked) => setIndicators({ ...indicators, sma50: !!checked })}
                />
                <div className="space-y-1">
                  <Label htmlFor="sma50" className="cursor-pointer">SMA 50</Label>
                  <p className="text-slate-500">Moyenne mobile simple</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Checkbox
                  id="ema"
                  checked={indicators.ema}
                  onCheckedChange={(checked) => setIndicators({ ...indicators, ema: !!checked })}
                />
                <div className="space-y-1">
                  <Label htmlFor="ema" className="cursor-pointer">EMA</Label>
                  <p className="text-slate-500">Moyenne mobile exponentielle</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Checkbox
                  id="bollinger"
                  checked={indicators.bollinger}
                  onCheckedChange={(checked) => setIndicators({ ...indicators, bollinger: !!checked })}
                />
                <div className="space-y-1">
                  <Label htmlFor="bollinger" className="cursor-pointer">Bandes de Bollinger</Label>
                  <p className="text-slate-500">Enveloppe de volatilité</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Checkbox
                  id="rsi"
                  checked={indicators.rsi}
                  onCheckedChange={(checked) => setIndicators({ ...indicators, rsi: !!checked })}
                />
                <div className="space-y-1">
                  <Label htmlFor="rsi" className="cursor-pointer">RSI</Label>
                  <p className="text-slate-500">Indice de force relative</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Checkbox
                  id="macd"
                  checked={indicators.macd}
                  onCheckedChange={(checked) => setIndicators({ ...indicators, macd: !!checked })}
                />
                <div className="space-y-1">
                  <Label htmlFor="macd" className="cursor-pointer">MACD</Label>
                  <p className="text-slate-500">Convergence/Divergence</p>
                </div>
              </div>
            </div>

            <Button className="w-full" variant="outline" onClick={() => setIndicators({
              sma20: false,
              sma50: false,
              ema: false,
              bollinger: false,
              rsi: false,
              macd: false,
            })}>
              Réinitialiser
            </Button>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Graphique de prix - {crypto.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2} name="Prix" dot={false} />
                  {indicators.sma20 && (
                    <Line type="monotone" dataKey="sma20" stroke="#8b5cf6" strokeWidth={2} name="SMA 20" dot={false} />
                  )}
                  {indicators.sma50 && (
                    <Line type="monotone" dataKey="sma50" stroke="#10b981" strokeWidth={2} name="SMA 50" dot={false} />
                  )}
                  {indicators.ema && (
                    <Line type="monotone" dataKey="ema" stroke="#f59e0b" strokeWidth={2} name="EMA" dot={false} />
                  )}
                  {indicators.bollinger && (
                    <>
                      <Line type="monotone" dataKey="bollingerUpper" stroke="#ef4444" strokeWidth={1} strokeDasharray="5 5" name="Bollinger Haut" dot={false} />
                      <Line type="monotone" dataKey="bollingerMiddle" stroke="#64748b" strokeWidth={1} name="Bollinger Milieu" dot={false} />
                      <Line type="monotone" dataKey="bollingerLower" stroke="#ef4444" strokeWidth={1} strokeDasharray="5 5" name="Bollinger Bas" dot={false} />
                    </>
                  )}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {indicators.rsi && (
            <Card>
              <CardHeader>
                <CardTitle>RSI (Relative Strength Index)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                      }}
                    />
                    <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" label="Surachat" />
                    <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" label="Survente" />
                    <Line type="monotone" dataKey="rsi" stroke="#8b5cf6" strokeWidth={2} name="RSI" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {indicators.macd && (
            <Card>
              <CardHeader>
                <CardTitle>MACD</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                      }}
                    />
                    <ReferenceLine y={0} stroke="#64748b" />
                    <Line type="monotone" dataKey="macd" stroke="#3b82f6" strokeWidth={2} name="MACD" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Indicator Explanations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(indicators).map(([key, enabled]) => {
              if (!enabled) return null;
              const info = indicatorInfo[key as keyof typeof indicatorInfo];
              return (
                <Card key={key}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Info className="size-5 text-blue-600" />
                      {info.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <p className="text-slate-600">{info.description}</p>
                    </div>
                    <div className="pt-2 border-t">
                      <p className="text-slate-600">
                        <span className="text-slate-900">Interprétation:</span> {info.interpretation}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
