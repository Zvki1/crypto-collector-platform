import { useState, FormEvent, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Wallet,
  DollarSign,
  Activity,
} from "lucide-react";
import { formatCurrency, formatPercent } from "../utils/mockData";
import { authService } from "../services/api";

export default function PortfolioPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [portfolioOverview, setPortfolioOverview] = useState<any>(null);
  const [balance, setBalance] = useState<number>(0);
  const [holdings, setHoldings] = useState<any[]>([]);

  const [cryptos, setCryptos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [formData, setFormData] = useState({
    cryptoId: "",
    type: "achat" as "achat" | "vente",
    quantity: "",
    price: "",
  });

  useEffect(() => {
    const init = async () => {
      await checkDepositReturn();
      await fetchData();
    };
    init();
  }, []);

  const checkDepositReturn = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const depositStatus = urlParams.get("deposit");
    const sessionId = urlParams.get("session_id");

    console.log(
      "[Portfolio] Deposit status:",
      depositStatus,
      "Session ID:",
      sessionId
    );

    if (depositStatus === "success" && sessionId) {
      try {
        console.log("[Portfolio] Confirming deposit...");
        const result = await authService.confirmDeposit(sessionId);
        console.log("[Portfolio] Confirmation result:", result);

        if (result.status === "COMPLETED") {
          console.log("[Portfolio] Deposit completed successfully");
          setSuccessMessage(
            `Dépôt de ${result.amount}€ confirmé avec succès !`
          );
          // Masquer le message après 5 secondes
          setTimeout(() => setSuccessMessage(""), 5000);
        } else {
          console.log("[Portfolio] Deposit status:", result.status);
          setError(
            `Statut du paiement: ${result.status}. ${result.message || ""}`
          );
        }
      } catch (err) {
        console.error(
          "[Portfolio] Erreur lors de la confirmation du dépôt:",
          err
        );
        const errorMessage =
          err instanceof Error ? err.message : "Erreur inconnue";
        setError(`Erreur lors de la confirmation: ${errorMessage}`);
      } finally {
        // Nettoyer l'URL et rediriger vers la bonne route
        if (window.location.pathname === "/portfolio") {
          window.location.href = "/portefeuille";
        } else {
          window.history.replaceState({}, "", window.location.pathname);
        }
      }
    } else if (depositStatus === "cancelled") {
      console.log("[Portfolio] Deposit cancelled");
      // Nettoyer l'URL et rediriger vers la bonne route
      if (window.location.pathname === "/portfolio") {
        window.location.href = "/portefeuille";
      } else {
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [
        cryptosData,
        transactionsData,
        overviewData,
        balanceData,
        holdingsData,
      ] = await Promise.all([
        authService.getCryptos(),
        authService.getTransactions(),
        authService.getPortfolioOverview(),
        authService.getBalance(),
        authService.getHoldings(),
      ]);
      setCryptos(cryptosData);
      setTransactions(transactionsData);
      setPortfolioOverview(overviewData);
      setBalance(balanceData.balance || 0);
      setHoldings(holdingsData);
    } catch (err) {
      console.error("Erreur lors du chargement des données:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError("");

      await authService.createTransaction({
        type: formData.type === "achat" ? "BUY" : "SELL",
        cryptocurrencyId: formData.cryptoId,
        amount: parseFloat(formData.quantity),
      });

      // Recharger les transactions
      await fetchData();

      setIsDialogOpen(false);
      setFormData({
        cryptoId: "",
        type: "achat",
        quantity: "",
        price: "",
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erreur lors de la création de la transaction";
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeposit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError("");

      const result = await authService.createDeposit(parseFloat(depositAmount));

      // Rediriger vers Stripe
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erreur lors de la création du dépôt";
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate portfolio metrics
  const portfolio = transactions.reduce((acc, transaction) => {
    const crypto = cryptos.find((c) => c.id === transaction.cryptocurrencyId);
    if (!crypto) return acc;

    const existing = acc.find(
      (p) => p.cryptoId === transaction.cryptocurrencyId
    );
    const quantity =
      transaction.type === "BUY"
        ? parseFloat(transaction.amount)
        : -parseFloat(transaction.amount);
    const invested =
      transaction.type === "BUY"
        ? parseFloat(transaction.totalValue)
        : -parseFloat(transaction.totalValue);

    if (existing) {
      existing.quantity += quantity;
      existing.invested += invested;
      existing.currentValue =
        existing.quantity *
        parseFloat(crypto.currentPrice || crypto.price || 0);
      existing.pnl = existing.currentValue - existing.invested;
      existing.roi =
        existing.invested !== 0 ? (existing.pnl / existing.invested) * 100 : 0;
    } else {
      const currentPrice = parseFloat(crypto.currentPrice || crypto.price || 0);
      acc.push({
        cryptoId: transaction.cryptocurrencyId,
        cryptoName: transaction.cryptocurrency?.name || crypto.name,
        quantity,
        invested,
        currentValue: quantity * currentPrice,
        pnl: quantity * currentPrice - invested,
        roi:
          invested !== 0
            ? ((quantity * currentPrice - invested) / invested) * 100
            : 0,
        currentPrice: currentPrice,
      });
    }

    return acc;
  }, [] as any[]);

  // Utiliser les données du backend pour les métriques globales
  const totalInvested = portfolioOverview?.totalInvested || 0;
  const totalCurrentValue = portfolioOverview?.totalValue || 0;
  const totalPnL = portfolioOverview?.pl || 0;
  const totalROI = portfolioOverview?.roi || 0;

  // Utiliser les holdings pour le graphique en camembert
  const pieData = holdings
    .filter((h) => h.quantity > 0)
    .map((h) => ({
      name: h.name,
      value: h.quantity * parseFloat(h.currentPrice || 0),
    }));

  const COLORS = [
    "#3b82f6",
    "#8b5cf6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#06b6d4",
    "#ec4899",
    "#14b8a6",
  ];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Wallet className="size-12 text-blue-600 animate-pulse mx-auto" />
          <p className="text-slate-600">Chargement du portefeuille...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Message de succès */}
      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800">✅ {successMessage}</p>
        </div>
      )}

      {/* Message d'erreur */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex justify-between items-start">
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => setError("")}
              className="text-red-600 hover:text-red-800"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-slate-900 mb-1">Portefeuille virtuel</h1>
          <p className="text-slate-600">
            Suivez vos investissements et performances
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="outline" className="text-lg px-3 py-1">
              Solde: {formatCurrency(balance)}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog
            open={isDepositDialogOpen}
            onOpenChange={(open) => {
              setIsDepositDialogOpen(open);
              if (!open) {
                setError("");
                setDepositAmount("");
              }
            }}
          >
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="border-green-600 text-green-600  hover:bg-green-500"
              >
                <Plus className="size-4 mr-2" />
                Déposer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Déposer des fonds</DialogTitle>
                <DialogDescription>
                  Ajoutez de l'argent à votre portefeuille pour acheter des
                  cryptomonnaies
                </DialogDescription>
              </DialogHeader>
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}
              <form onSubmit={handleDeposit} className="space-y-4">
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Montant (€)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="1"
                      placeholder="100"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      required
                    />
                    <p className="text-sm text-slate-500">Minimum: 1€</p>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDepositDialogOpen(false)}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {submitting
                      ? "Redirection..."
                      : "Continuer vers le paiement"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setError("");
                setFormData({
                  cryptoId: "",
                  type: "achat",
                  quantity: "",
                  price: "",
                });
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="size-4 mr-2" />
                Ajouter une transaction
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouvelle transaction</DialogTitle>
                <DialogDescription>
                  Enregistrez un achat ou une vente de cryptomonnaie
                </DialogDescription>
              </DialogHeader>
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Type de transaction</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: any) =>
                        setFormData({ ...formData, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="achat">Achat</SelectItem>
                        <SelectItem value="vente">Vente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="crypto">Cryptomonnaie</Label>
                    <Select
                      value={formData.cryptoId}
                      onValueChange={(value) => {
                        const crypto = cryptos.find((c) => c.id === value);
                        setFormData({
                          ...formData,
                          cryptoId: value,
                          price: crypto?.currentPrice?.toString() || "",
                        });
                      }}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une crypto" />
                      </SelectTrigger>
                      <SelectContent>
                        {cryptos.map((crypto) => (
                          <SelectItem key={crypto.id} value={crypto.id}>
                            <div className="flex items-center gap-2">
                              <img
                                src={crypto.image}
                                alt={crypto.name}
                                className="size-5 rounded-full"
                              />
                              {crypto.name} ({crypto.symbol})
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantité</Label>
                    <Input
                      id="quantity"
                      type="number"
                      step="0.00000001"
                      placeholder="0.5"
                      value={formData.quantity}
                      onChange={(e) =>
                        setFormData({ ...formData, quantity: e.target.value })
                      }
                      required
                    />
                  </div>

                  {formData.cryptoId && formData.quantity && formData.price && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-blue-900">
                        Prix actuel:{" "}
                        {formatCurrency(parseFloat(formData.price))}
                      </p>
                      <p className="text-blue-900">
                        Total:{" "}
                        {formatCurrency(
                          parseFloat(formData.quantity) *
                            parseFloat(formData.price)
                        )}
                      </p>
                    </div>
                  )}

                  {formData.type === "achat" &&
                    formData.quantity &&
                    formData.price &&
                    parseFloat(formData.quantity) * parseFloat(formData.price) >
                      balance && (
                      <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <p className="text-orange-800 text-sm">
                          ⚠️ Solde insuffisant. Vous avez{" "}
                          {formatCurrency(balance)} mais l'achat coûte{" "}
                          {formatCurrency(
                            parseFloat(formData.quantity) *
                              parseFloat(formData.price)
                          )}
                          .
                          <br />
                          <button
                            type="button"
                            onClick={() => {
                              setIsDialogOpen(false);
                              setIsDepositDialogOpen(true);
                            }}
                            className="underline font-medium mt-1"
                          >
                            Déposer des fonds
                          </button>
                        </p>
                      </div>
                    )}
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={
                      submitting ||
                      (formData.type === "achat" &&
                        formData.quantity &&
                        formData.price &&
                        parseFloat(formData.quantity) *
                          parseFloat(formData.price) >
                          balance)
                    }
                  >
                    {submitting ? "Création..." : "Ajouter la transaction"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-slate-600">Valeur totale</p>
                <p className="text-slate-900">
                  {formatCurrency(totalCurrentValue)}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                <Wallet className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-slate-600">Total investi</p>
                <p className="text-slate-900">
                  {formatCurrency(totalInvested)}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                <DollarSign className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-slate-600">P&L</p>
                <p
                  className={totalPnL >= 0 ? "text-green-600" : "text-red-600"}
                >
                  {formatCurrency(totalPnL)}
                </p>
              </div>
              <div
                className={`p-2 rounded-lg ${
                  totalPnL >= 0
                    ? "bg-green-100 text-green-600"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {totalPnL >= 0 ? (
                  <TrendingUp className="size-5" />
                ) : (
                  <TrendingDown className="size-5" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-slate-600">ROI</p>
                <p
                  className={totalROI >= 0 ? "text-green-600" : "text-red-600"}
                >
                  {formatPercent(totalROI)}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
                <Activity className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Répartition du portefeuille</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-slate-500">Aucune position ouverte</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Positions actuelles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {holdings.filter((h) => h.quantity > 0).length > 0 ? (
                holdings
                  .filter((h) => h.quantity > 0)
                  .map((position) => {
                    const currentPrice = parseFloat(position.currentPrice) || 0;
                    const currentValue = position.quantity * currentPrice;

                    return (
                      <div
                        key={position.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {position.image && (
                            <img
                              src={position.image}
                              alt={position.name}
                              className="w-8 h-8 rounded-full"
                            />
                          )}
                          <div className="space-y-1">
                            <p className="font-medium text-slate-900">
                              {position.name}
                            </p>
                            <p className="text-sm text-slate-600">
                              {position.quantity.toFixed(8)} {position.symbol} ×{" "}
                              {formatCurrency(currentPrice)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-slate-900">
                            {formatCurrency(currentValue)}
                          </p>
                          <p className="text-sm text-slate-500">
                            {position.symbol}
                          </p>
                        </div>
                      </div>
                    );
                  })
              ) : (
                <p className="text-slate-500 text-center py-8">
                  Aucune position ouverte
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions History */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des transactions</CardTitle>
          <CardDescription>
            Liste de toutes vos transactions ({transactions.length})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Cryptomonnaie</TableHead>
                    <TableHead className="text-right">Quantité</TableHead>
                    <TableHead className="text-right">Prix unitaire</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {new Date(
                          transaction.transactionDate || transaction.createdAt
                        ).toLocaleDateString("fr-FR")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            transaction.type === "BUY"
                              ? "default"
                              : "destructive"
                          }
                          className={
                            transaction.type === "BUY"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }
                        >
                          {transaction.type === "BUY" ? "achat" : "vente"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-900">
                        {transaction.cryptocurrency?.name || "N/A"}
                      </TableCell>
                      <TableCell className="text-right text-slate-900">
                        {parseFloat(transaction.amount).toFixed(8)}
                      </TableCell>
                      <TableCell className="text-right text-slate-900">
                        {formatCurrency(parseFloat(transaction.price))}
                      </TableCell>
                      <TableCell className="text-right text-slate-900">
                        {formatCurrency(parseFloat(transaction.totalValue))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Wallet className="size-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-slate-900 mb-2">Aucune transaction</h3>
              <p className="text-slate-600 mb-4">
                Ajoutez votre première transaction pour commencer à suivre votre
                portefeuille
              </p>
              <Button
                onClick={() => setIsDialogOpen(true)}
                variant="outline"
                className="mx-auto"
              >
                <Plus className="size-4 mr-2" />
                Ajouter une transaction
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
