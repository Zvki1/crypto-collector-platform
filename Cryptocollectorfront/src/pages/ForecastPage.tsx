import { useState, useMemo, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Brain,
  Loader2,
} from "lucide-react";
import { formatCurrency } from "../utils/mockData";
import { authService } from "../services/api";

export default function ForecastPage() {
  const [cryptos, setCryptos] = useState<any[]>([]);
  const [selectedCrypto, setSelectedCrypto] = useState("");
  const [forecastDays, setForecastDays] = useState<7 | 14 | 30>(7);
  const [loading, setLoading] = useState(true);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [error, setError] = useState("");
  const [forecastData, setForecastData] = useState<any>(null);

  useEffect(() => {
    fetchCryptos();
  }, []);

  useEffect(() => {
    if (selectedCrypto) {
      fetchForecast();
    }
  }, [selectedCrypto, forecastDays]);

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

  const fetchForecast = async () => {
    try {
      setLoadingForecast(true);
      setError("");
      const data = await authService.getPredictions(
        selectedCrypto,
        forecastDays
      );
      setForecastData(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des prédictions";
      setError(errorMessage);
    } finally {
      setLoadingForecast(false);
    }
  };

  const crypto = cryptos.find((c) => c.id === selectedCrypto);

  // Préparer les données pour le graphique
  const chartData = useMemo(() => {
    if (!forecastData?.forecast?.predictions) return [];

    return forecastData.forecast.predictions.map((pred: any) => ({
      date: new Date(pred.date).toLocaleDateString("fr-FR", {
        month: "short",
        day: "numeric",
      }),
      predicted: pred.predictedPrice,
      confidence: pred.confidence * 100,
    }));
  }, [forecastData]);

  const currentPrice = forecastData?.forecast?.currentPrice || 0;
  const finalPrice =
    forecastData?.forecast?.predictions?.[
      forecastData.forecast.predictions.length - 1
    ]?.predictedPrice || 0;
  const priceChange =
    currentPrice > 0 ? ((finalPrice - currentPrice) / currentPrice) * 100 : 0;

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
                  onClick={fetchForecast}
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

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-slate-900 mb-1">Prévisions de prix</h1>
        <p className="text-slate-600">
          Modèles prédictifs basés sur l'analyse historique
        </p>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-slate-700 mb-2 block">Cryptomonnaie</label>
              <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cryptos.map((crypto) => (
                    <SelectItem key={crypto.id} value={crypto.id}>
                      <div className="flex items-center gap-2">
                        <span>{crypto.name}</span>
                        <span className="text-slate-500">
                          ({crypto.symbol})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-slate-700 mb-2 block">
                Période de prévision
              </label>
              <Select
                value={forecastDays.toString()}
                onValueChange={(v) =>
                  setForecastDays(parseInt(v) as 7 | 14 | 30)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 jours</SelectItem>
                  <SelectItem value="14">14 jours</SelectItem>
                  <SelectItem value="30">30 jours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Forecast */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-slate-600 text-sm">Prix actuel</p>
                <p className="text-2xl font-semibold text-slate-900">
                  {formatCurrency(currentPrice)}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-slate-600 text-sm">
                  Prix prévu ({forecastDays}j)
                </p>
                <p className="text-2xl font-semibold text-slate-900">
                  {formatCurrency(finalPrice)}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-slate-600 text-sm">Variation prévue</p>
                  <p
                    className={`text-2xl font-semibold ${
                      priceChange >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {priceChange >= 0 ? "+" : ""}
                    {priceChange.toFixed(2)}%
                  </p>
                </div>
                <div
                  className={`p-2 rounded-lg ${
                    priceChange >= 0
                      ? "bg-green-100 text-green-600"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {priceChange >= 0 ? (
                    <TrendingUp className="size-5" />
                  ) : (
                    <TrendingDown className="size-5" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              Prévision - {forecastData?.forecast?.model || "Moyennes Mobiles"}
            </CardTitle>
            <CardDescription>
              {forecastData?.forecast?.description ||
                "Modèle de prédiction basé sur l'analyse historique"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingForecast ? (
              <div className="flex items-center justify-center h-[400px]">
                <div className="text-center space-y-4">
                  <Loader2 className="size-8 text-blue-600 animate-spin mx-auto" />
                  <p className="text-slate-600">
                    Chargement des prédictions...
                  </p>
                </div>
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex items-center justify-center h-[400px]">
                <p className="text-slate-500">
                  Aucune donnée de prédiction disponible
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient
                      id="colorPredicted"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
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
                    formatter={(value: any, name: string) => {
                      if (name === "predicted")
                        return [formatCurrency(value), "Prix prévu"];
                      if (name === "confidence")
                        return [`${value.toFixed(0)}%`, "Confiance"];
                      return [value, name];
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="predicted"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    fill="url(#colorPredicted)"
                    name="Prix prévu"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>À propos de ce modèle</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-row justify-between">
            <div className="flex-1">
              <h4 className="font-medium text-slate-900 mb-1">
                Fonctionnement
              </h4>
              <p className="text-sm text-slate-600">
                {forecastData?.forecast?.description ||
                  "Ce modèle utilise la moyenne mobile simple (SMA) des 20 dernières périodes pour prédire les prix futurs."}
              </p>
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-slate-900 mb-1">Métadonnées</h4>
              <p className="text-sm text-slate-600">
                Points de données historiques:{" "}
                {forecastData?.metadata?.historicalDataPoints || "N/A"} |
                Fenêtre d'analyse: {forecastData?.metadata?.windowSize || "N/A"}{" "}
                périodes
              </p>
            </div>
            {forecastData?.forecast?.generatedAt && (
              <div className="flex-1">
                <h4 className="font-medium text-slate-900 mb-1">Généré le</h4>
                <p className="text-sm text-slate-600">
                  {new Date(forecastData.forecast.generatedAt).toLocaleString(
                    "fr-FR"
                  )}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
