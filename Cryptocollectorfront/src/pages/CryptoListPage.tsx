import { useState, useMemo, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Star,
  TrendingUp,
  TrendingDown,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { formatCurrency, formatNumber, formatPercent } from "../utils/mockData";
import { authService } from "../services/api";

export default function CryptoListPage() {
  const [cryptos, setCryptos] = useState<any[]>([]);
  const [overview, setOverview] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<
    "currentPrice" | "totalVolume" | "marketCap"
  >("marketCap");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const itemsPerPage = 10;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const [cryptosData, overviewData] = await Promise.all([
        authService.getCryptos(),
        authService.getCryptosOverview(),
      ]);
      setCryptos(cryptosData);
      setOverview(overviewData);
    } catch (err) {
      setError("Impossible de charger les données");
    } finally {
      setLoading(false);
    }
  };

  const filteredCryptos = useMemo(() => {
    let result = cryptos.filter(
      (crypto) =>
        crypto.name.toLowerCase().includes(search.toLowerCase()) ||
        crypto.symbol.toLowerCase().includes(search.toLowerCase())
    );

    result.sort((a, b) => {
      const aValue = parseFloat(a.marketData?.[0]?.[sortBy] || "0");
      const bValue = parseFloat(b.marketData?.[0]?.[sortBy] || "0");
      return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
    });

    return result;
  }, [cryptos, search, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredCryptos.length / itemsPerPage);
  const paginatedCryptos = filteredCryptos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (column: "currentPrice" | "totalVolume" | "marketCap") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  const toggleFavorite = (cryptoId: string) => {
    setFavorites((prev) =>
      prev.includes(cryptoId)
        ? prev.filter((id) => id !== cryptoId)
        : [...prev, cryptoId]
    );
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="size-12 text-blue-600 animate-spin mx-auto" />
          <p className="text-slate-600">Chargement des cryptomonnaies...</p>
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
                  onClick={fetchData}
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

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-slate-900 mb-1">Cryptomonnaies</h1>
        <p className="text-slate-600">
          Liste complète des cryptomonnaies disponibles
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>Toutes les cryptomonnaies</CardTitle>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <Input
                placeholder="Rechercher une cryptomonnaie..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead className="text-right">
                    <button
                      onClick={() => handleSort("currentPrice")}
                      className="flex items-center gap-1 ml-auto hover:text-slate-900"
                    >
                      Prix
                      <ArrowUpDown className="size-4" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">Variation 24h</TableHead>
                  <TableHead className="text-right">
                    <button
                      onClick={() => handleSort("marketCap")}
                      className="flex items-center gap-1 ml-auto hover:text-slate-900"
                    >
                      Capitalisation
                      <ArrowUpDown className="size-4" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">
                    <button
                      onClick={() => handleSort("totalVolume")}
                      className="flex items-center gap-1 ml-auto hover:text-slate-900"
                    >
                      Volume 24h
                      <ArrowUpDown className="size-4" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">Fourchette 24h</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCryptos.map((crypto, index) => {
                  const marketData = crypto.marketData?.[0];
                  if (!marketData) return null;

                  return (
                    <TableRow key={crypto.id} className="hover:bg-slate-50">
                      <TableCell>
                        <button
                          onClick={() => toggleFavorite(crypto.id)}
                          className="text-slate-400 hover:text-yellow-500 transition-colors"
                        >
                          <Star
                            className={`size-4 ${
                              favorites.includes(crypto.id)
                                ? "fill-yellow-500 text-yellow-500"
                                : ""
                            }`}
                          />
                        </button>
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </TableCell>
                      <TableCell>
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
                      </TableCell>
                      <TableCell className="text-right text-slate-900">
                        {formatCurrency(parseFloat(marketData.currentPrice))}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={
                            parseFloat(marketData.priceChangePercentage24h) >= 0
                              ? "default"
                              : "destructive"
                          }
                          className={
                            parseFloat(marketData.priceChangePercentage24h) >= 0
                              ? "bg-green-100 text-green-700 hover:bg-green-100"
                              : "bg-red-100 text-red-700 hover:bg-red-100"
                          }
                        >
                          <span className="flex items-center gap-1">
                            {parseFloat(marketData.priceChangePercentage24h) >=
                            0 ? (
                              <TrendingUp className="size-3" />
                            ) : (
                              <TrendingDown className="size-3" />
                            )}
                            {formatPercent(
                              parseFloat(marketData.priceChangePercentage24h)
                            )}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-slate-900">
                        {formatNumber(parseFloat(marketData.marketCap))} €
                      </TableCell>
                      <TableCell className="text-right text-slate-900">
                        {formatNumber(parseFloat(marketData.totalVolume))} €
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col gap-1">
                          <span className="text-green-600">
                            {formatCurrency(parseFloat(marketData.high24h))}
                          </span>
                          <span className="text-red-600">
                            {formatCurrency(parseFloat(marketData.low24h))}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t">
            <p className="text-slate-600">
              Affichage de {(currentPage - 1) * itemsPerPage + 1} à{" "}
              {Math.min(currentPage * itemsPerPage, filteredCryptos.length)} sur{" "}
              {filteredCryptos.length} résultats
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="size-4 mr-1" />
                Précédent
              </Button>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className={
                        currentPage === pageNum
                          ? "bg-blue-600 hover:bg-blue-700"
                          : ""
                      }
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
              >
                Suivant
                <ChevronRight className="size-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Market Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-slate-600">Cryptomonnaies actives</p>
              <p className="text-slate-900">{overview?.activeCryptos || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-slate-600">Volume total 24h</p>
              <p className="text-slate-900">
                {formatNumber(overview?.totalVolume24h || 0)} €
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-slate-600">Cap. totale du marché</p>
              <p className="text-slate-900">
                {formatNumber(overview?.totalMarketCap || 0)} €
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
