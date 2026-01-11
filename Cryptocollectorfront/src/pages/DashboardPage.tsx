import { useState, useMemo, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  BarChart3,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { formatNumber, formatCurrency, formatPercent } from "../utils/mockData";
import { authService } from "../services/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

export default function DashboardPage() {
  const [cryptos, setCryptos] = useState<any[]>([]);
  const [selectedCrypto, setSelectedCrypto] = useState("");
  const [timeRange, setTimeRange] = useState("7j");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [historicalData, setHistoricalData] = useState<any>(null);
  const [loadingChart, setLoadingChart] = useState(false);

  useEffect(() => {
    fetchCryptos();
  }, []);

  useEffect(() => {
    if (selectedCrypto) {
      fetchMarketData();
    }
  }, [selectedCrypto, timeRange]);

  const fetchCryptos = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await authService.getCryptos();
      setCryptos(data);
      if (data.length > 0) {
        setSelectedCrypto(data[0].id);
      }
    } catch (err) {
      setError("Impossible de charger les cryptomonnaies");
    } finally {
      setLoading(false);
    }
  };

  const fetchMarketData = async () => {
    try {
      setLoadingChart(true);
      const timeRangeDays = {
        "24h": 1,
        "7j": 7,
        "1m": 30,
        "3m": 90,
        "1a": 365,
      };
      const days = timeRangeDays[timeRange as keyof typeof timeRangeDays] || 7;
      const data = await authService.getMarketData(selectedCrypto, days);
      setHistoricalData(data);
    } catch (err) {
      console.error("Erreur lors du chargement des données du marché:", err);
    } finally {
      setLoadingChart(false);
    }
  };

  const crypto = cryptos.find((c) => c.id === selectedCrypto);
  const latestMarketData = crypto?.marketData?.[0];

  const timeRangeDays = {
    "24h": 1,
    "7j": 7,
    "1m": 30,
    "3m": 90,
    "1a": 365,
  };

  // Utiliser les vraies données historiques
  const priceHistory = useMemo(() => {
    if (!historicalData?.marketData || historicalData.marketData.length === 0) {
      return [];
    }

    // Déterminer le format de date selon la période
    const getDateFormat = (timestamp: string) => {
      const date = new Date(timestamp);

      // Pour 24h et 7j : afficher l'heure (granularité par heure)
      if (timeRange === "24h" || timeRange === "7j") {
        return date.toLocaleString("fr-FR", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      }

      // Pour 1m, 3m, 1a : afficher seulement la date (granularité par jour)
      return date.toLocaleDateString("fr-FR", {
        month: "short",
        day: "numeric",
      });
    };

    return historicalData.marketData.map((item: any) => {
      return {
        date: getDateFormat(item.timestamp),
        price: parseFloat(item.currentPrice),
        high: parseFloat(item.high24h || item.currentPrice),
        low: parseFloat(item.low24h || item.currentPrice),
        volume: parseFloat(item.totalVolume) / 1000000, // En millions
      };
    });
  }, [historicalData, timeRange]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="size-12 text-blue-600 animate-spin mx-auto" />
          <p className="text-slate-600">Chargement des données...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-800">
              <AlertCircle className="size-5 flex-shrink-0" />
              <div>
                <p className="font-medium">{error}</p>
                <Button
                  onClick={fetchCryptos}
                  variant="outline"
                  size="sm"
                  className="mt-3"
                >
                  Réessayer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (cryptos.length === 0) {
    return (
      <div className="max-w-7xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <AlertCircle className="size-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">Aucune cryptomonnaie disponible</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!crypto || !latestMarketData) {
    return null;
  }

  const kpiCards = [
    {
      title: "Prix actuel",
      value: formatCurrency(parseFloat(latestMarketData.currentPrice)),
      icon: DollarSign,
      color: "blue",
    },
    {
      title: "Variation 24h",
      value: formatPercent(
        parseFloat(latestMarketData.priceChangePercentage24h)
      ),
      icon:
        parseFloat(latestMarketData.priceChangePercentage24h) >= 0
          ? TrendingUp
          : TrendingDown,
      color:
        parseFloat(latestMarketData.priceChangePercentage24h) >= 0
          ? "green"
          : "red",
    },
    {
      title: "Capitalisation",
      value: formatNumber(parseFloat(latestMarketData.marketCap)) + " €",
      icon: BarChart3,
      color: "purple",
    },
    {
      title: "Volume 24h",
      value: formatNumber(parseFloat(latestMarketData.totalVolume)) + " €",
      icon: Activity,
      color: "orange",
    },
    {
      title: "Plus haut 24h",
      value: formatCurrency(parseFloat(latestMarketData.high24h)),
      icon: TrendingUp,
      color: "emerald",
    },
    {
      title: "Plus bas 24h",
      value: formatCurrency(parseFloat(latestMarketData.low24h)),
      icon: TrendingDown,
      color: "rose",
    },
  ];

  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    red: "bg-red-100 text-red-600",
    purple: "bg-purple-100 text-purple-600",
    orange: "bg-orange-100 text-orange-600",
    emerald: "bg-emerald-100 text-emerald-600",
    rose: "bg-rose-100 text-rose-600",
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-slate-900 mb-1">Tableau de bord</h1>
          <p className="text-slate-600">
            Surveillez vos cryptomonnaies en temps réel
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {cryptos.map((crypto) => (
                <SelectItem key={crypto.id} value={crypto.id}>
                  <div className="flex items-center gap-2">
                    <span>{crypto.name}</span>
                    <span className="text-slate-500">({crypto.symbol})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiCards.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-slate-600">{kpi.title}</p>
                    <p className="text-slate-900">{kpi.value}</p>
                  </div>
                  <div
                    className={`p-2 rounded-lg ${
                      colorClasses[kpi.color as keyof typeof colorClasses]
                    }`}
                  >
                    <Icon className="size-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Time Range Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {["24h", "7j", "1m", "3m", "1a"].map((range) => (
          <Button
            key={range}
            variant={timeRange === range ? "default" : "outline"}
            size="sm"
            onClick={() => range !== "personnalisé" && setTimeRange(range)}
            className={
              timeRange === range ? "bg-blue-600 hover:bg-blue-700" : ""
            }
          >
            {range}
          </Button>
        ))}
      </div>

      {/* Charts */}
      <Tabs defaultValue="ligne" className="space-y-4">
        <TabsList>
          <TabsTrigger value="ligne">Graphique linéaire</TabsTrigger>
          <TabsTrigger value="chandeliers">Chandeliers</TabsTrigger>
          <TabsTrigger value="volume">Volume</TabsTrigger>
        </TabsList>

        <TabsContent value="ligne">
          <Card>
            <CardHeader>
              <CardTitle>Évolution du prix - {crypto.name}</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingChart ? (
                <div className="flex items-center justify-center h-[400px]">
                  <div className="text-center space-y-4">
                    <Loader2 className="size-8 text-blue-600 animate-spin mx-auto" />
                    <p className="text-slate-600">Chargement du graphique...</p>
                  </div>
                </div>
              ) : priceHistory.length === 0 ? (
                <div className="flex items-center justify-center h-[400px]">
                  <p className="text-slate-500">Aucune donnée disponible</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={priceHistory}>
                    <defs>
                      <linearGradient
                        id="colorPrice"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#3b82f6"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#3b82f6"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="date"
                      stroke="#64748b"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      stroke="#64748b"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) =>
                        `${value.toLocaleString("fr-FR")} €`
                      }
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                      }}
                      formatter={(value: any) => [
                        `${value.toLocaleString("fr-FR")} €`,
                        "Prix",
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fill="url(#colorPrice)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chandeliers">
          <Card>
            <CardHeader>
              <CardTitle>Chandeliers - {crypto.name}</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingChart ? (
                <div className="flex items-center justify-center h-[400px]">
                  <div className="text-center space-y-4">
                    <Loader2 className="size-8 text-blue-600 animate-spin mx-auto" />
                    <p className="text-slate-600">Chargement du graphique...</p>
                  </div>
                </div>
              ) : priceHistory.length === 0 ? (
                <div className="flex items-center justify-center h-[400px]">
                  <p className="text-slate-500">Aucune donnée disponible</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={priceHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="date"
                      stroke="#64748b"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      stroke="#64748b"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) =>
                        `${value.toLocaleString("fr-FR")} €`
                      }
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                      }}
                      formatter={(value: any) =>
                        `${value.toLocaleString("fr-FR")} €`
                      }
                    />
                    <Bar dataKey="high" fill="#10b981" name="Haut" />
                    <Bar dataKey="low" fill="#ef4444" name="Bas" />
                    <Legend />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="volume">
          <Card>
            <CardHeader>
              <CardTitle>Volume des échanges - {crypto.name}</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingChart ? (
                <div className="flex items-center justify-center h-[400px]">
                  <div className="text-center space-y-4">
                    <Loader2 className="size-8 text-blue-600 animate-spin mx-auto" />
                    <p className="text-slate-600">Chargement du graphique...</p>
                  </div>
                </div>
              ) : priceHistory.length === 0 ? (
                <div className="flex items-center justify-center h-[400px]">
                  <p className="text-slate-500">Aucune donnée disponible</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={priceHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="date"
                      stroke="#64748b"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      stroke="#64748b"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `${value.toFixed(0)}M €`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                      }}
                      formatter={(value: any) => [
                        `${value.toFixed(2)}M €`,
                        "Volume",
                      ]}
                    />
                    <Bar dataKey="volume" fill="#8b5cf6" name="Volume" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Market Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Aperçu du marché</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {cryptos.slice(0, 5).map((crypto) => {
              const data = crypto.marketData?.[0];
              if (!data) return null;

              return (
                <div
                  key={crypto.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  onClick={() => setSelectedCrypto(crypto.id)}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={crypto.image}
                      alt={crypto.name}
                      className="size-10 rounded-full"
                    />
                    <div>
                      <p className="text-slate-900">{crypto.name}</p>
                      <p className="text-slate-500">{crypto.symbol}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-900">
                      {formatCurrency(parseFloat(data.currentPrice))}
                    </p>
                    <p
                      className={
                        parseFloat(data.priceChangePercentage24h) >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {formatPercent(parseFloat(data.priceChangePercentage24h))}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
