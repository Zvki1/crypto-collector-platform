import { useState, useEffect, FormEvent } from "react";
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
import { Bell, Plus, Trash2, Edit, Loader2, AlertCircle } from "lucide-react";
import { authService } from "../services/api";

interface Alert {
  id: string;
  cryptoId: string;
  cryptoName: string;
  condition: "above" | "below" | "change";
  value: number;
  notificationType: "email" | "discord";
  active: boolean;
  createdAt: Date;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [cryptos, setCryptos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    cryptoId: "",
    condition: "PRICE_ABOVE" as "PRICE_ABOVE" | "PRICE_BELOW",
    value: "",
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const [alertsData, cryptosData] = await Promise.all([
        authService.getAlerts(),
        authService.getCryptos(),
      ]);
      setAlerts(alertsData);
      setCryptos(cryptosData);
    } catch (err) {
      setError("Impossible de charger les alertes");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError("");

      if (editingAlert) {
        // Modification d'une alerte existante
        await authService.updateAlert(editingAlert.id, {
          // cryptocurrencyId: formData.cryptoId,
          type: formData.condition,
          targetPrice: parseFloat(formData.value),
        });
      } else {
        // Création d'une nouvelle alerte
        await authService.createAlert({
          cryptocurrencyId: formData.cryptoId,
          type: formData.condition,
          targetPrice: parseFloat(formData.value),
        });
      }

      // Recharger les alertes
      await fetchData();

      setIsDialogOpen(false);
      setEditingAlert(null);
      setFormData({
        cryptoId: "",
        condition: "PRICE_ABOVE",
        value: "",
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erreur lors de la création de l'alerte";
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (alert: any) => {
    setEditingAlert(alert);
    setFormData({
      cryptoId: alert.cryptocurrency?.id || alert.cryptocurrencyId,
      condition: alert.type,
      value: alert.targetPrice.toString(),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (alertId: string) => {
    try {
      setError("");
      await authService.deleteAlert(alertId);
      await fetchData();
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erreur lors de la suppression de l'alerte";
      setError(errorMessage);
    }
  };

  const toggleAlert = async (alertId: string) => {
    try {
      setError("");
      await authService.toggleAlert(alertId);
      await fetchData();
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erreur lors de la modification du statut de l'alerte";
      setError(errorMessage);
    }
  };

  const conditionLabels = {
    PRICE_ABOVE: "Prix supérieur à",
    PRICE_BELOW: "Prix inférieur à",
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="size-12 text-blue-600 animate-spin mx-auto" />
          <p className="text-slate-600">Chargement des alertes...</p>
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-slate-900 mb-1">Alertes personnalisées</h1>
          <p className="text-slate-600">
            Recevez des notifications pour vos cryptomonnaies favorites
          </p>
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingAlert(null);
              setFormData({
                cryptoId: "",
                condition: "PRICE_ABOVE",
                value: "",
              });
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="size-4 mr-2" />
              Créer une alerte
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingAlert
                  ? "Modifier l'alerte"
                  : "Créer une nouvelle alerte"}
              </DialogTitle>
              <DialogDescription>
                Configurez une alerte pour être notifié des mouvements de prix
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="crypto">Cryptomonnaie</Label>
                  <Select
                    value={formData.cryptoId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, cryptoId: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une crypto" />
                    </SelectTrigger>
                    <SelectContent>
                      {cryptos.map((crypto) => (
                        <SelectItem key={crypto.id} value={crypto.id}>
                          {crypto.name} ({crypto.symbol})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="condition">Condition</Label>
                  <Select
                    value={formData.condition}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, condition: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PRICE_ABOVE">
                        Prix supérieur à
                      </SelectItem>
                      <SelectItem value="PRICE_BELOW">
                        Prix inférieur à
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="value">Prix seuil (€)</Label>
                  <Input
                    id="value"
                    type="number"
                    step="0.01"
                    placeholder="45000"
                    value={formData.value}
                    onChange={(e) =>
                      setFormData({ ...formData, value: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={submitting}
                >
                  {submitting
                    ? "Création..."
                    : editingAlert
                    ? "Modifier"
                    : "Créer l'alerte"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Mes alertes ({alerts.length})</CardTitle>
          <CardDescription>
            Gérez vos alertes de prix et notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="size-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-slate-900 mb-2">Aucune alerte configurée</h3>
              <p className="text-slate-600 mb-4">
                Créez votre première alerte pour être notifié des mouvements de
                prix
              </p>
              <Button
                onClick={() => setIsDialogOpen(true)}
                variant="outline"
                className="mx-auto"
              >
                <Plus className="size-4 mr-2" />
                Créer une alerte
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-2 rounded-lg ${
                        alert.status === "ACTIVE"
                          ? "bg-blue-100 text-blue-600"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      <Bell className="size-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <img
                          src={alert.cryptocurrency?.image}
                          alt={alert.cryptocurrency?.name}
                          className="size-6 rounded-full"
                        />
                        <span className="text-slate-900">
                          {alert.cryptocurrency?.name}
                        </span>
                        <Badge
                          variant={
                            alert.status === "ACTIVE" ? "default" : "secondary"
                          }
                          className={
                            alert.status === "ACTIVE"
                              ? "bg-green-100 text-green-700"
                              : ""
                          }
                        >
                          {alert.status === "ACTIVE" ? "Active" : "Inactive"}
                        </Badge>
                        {alert.triggeredAt && (
                          <Badge
                            variant="secondary"
                            className="bg-orange-100 text-orange-700"
                          >
                            Déclenchée
                          </Badge>
                        )}
                      </div>
                      <p className="text-slate-600">
                        {
                          conditionLabels[
                            alert.type as keyof typeof conditionLabels
                          ]
                        }{" "}
                        {alert.targetPrice} €
                      </p>
                      <div className="flex items-center gap-2 text-slate-500">
                        <span>
                          Créée le{" "}
                          {new Date(alert.createdAt).toLocaleDateString(
                            "fr-FR"
                          )}
                        </span>
                        {alert.triggeredAt && (
                          <>
                            <span>•</span>
                            <span>
                              Déclenchée le{" "}
                              {new Date(alert.triggeredAt).toLocaleDateString(
                                "fr-FR"
                              )}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleAlert(alert.id)}
                    >
                      {alert.status === "ACTIVE" ? "Désactiver" : "Activer"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(alert)}
                    >
                      <Edit className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(alert.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
