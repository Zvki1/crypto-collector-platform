import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Bitcoin, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import { authService } from "../services/api";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const passwordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    return strength;
  };

  const strength = passwordStrength(formData.password);
  const strengthLabels = ["Faible", "Moyen", "Bon", "Fort"];
  const strengthColors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-green-500",
  ];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    if (formData.password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    setLoading(true);

    try {
      await authService.register({
        email: formData.email,
        username: formData.username,
        password: formData.password,
      });

      setSuccess(true);

      navigate("/connexion");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erreur lors de l'inscription";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto bg-gradient-to-br from-blue-600 to-blue-700 p-3 rounded-xl w-fit">
            <Bitcoin className="size-8 text-white" />
          </div>
          <CardTitle className="text-slate-900">Créer un compte</CardTitle>
          <CardDescription>
            Rejoignez CryptoMonitor et suivez vos investissements
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-start gap-3">
                <AlertCircle className="size-5 mt-0.5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-start gap-3">
                <CheckCircle2 className="size-5 mt-0.5 flex-shrink-0" />
                <p className="text-sm">
                  Compte créé avec succès! Redirection...
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="username">Nom d'utilisateur</Label>
              <Input
                id="username"
                type="text"
                placeholder="Zvki11"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Adresse e-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {formData.password && (
                <div className="space-y-2">
                  <div className="flex gap-1">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          i < strength
                            ? strengthColors[strength - 1]
                            : "bg-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-slate-600">
                    Force:{" "}
                    {strength > 0
                      ? strengthLabels[strength - 1]
                      : "Très faible"}
                  </p>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {formData.confirmPassword &&
                formData.password === formData.confirmPassword && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="size-4" />
                    <span>Les mots de passe correspondent</span>
                  </div>
                )}
            </div>
            <label className="flex items-start gap-2 text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5 rounded border-slate-300"
                required
              />
              <span>
                J'accepte les{" "}
                <Link to="#" className="text-blue-600 hover:text-blue-700">
                  conditions d'utilisation
                </Link>{" "}
                et la{" "}
                <Link to="#" className="text-blue-600 hover:text-blue-700">
                  politique de confidentialité
                </Link>
              </span>
            </label>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? "Création..." : "Créer mon compte"}
            </Button>
            <p className="text-center text-slate-600">
              Vous avez déjà un compte?{" "}
              <Link
                to="/connexion"
                className="text-blue-600 hover:text-blue-700"
              >
                Se connecter
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
