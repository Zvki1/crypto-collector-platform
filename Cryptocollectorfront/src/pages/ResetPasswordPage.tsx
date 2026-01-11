import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Bitcoin, ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setSent(true);
      toast.success('Email de réinitialisation envoyé!');
      setLoading(false);
    }, 1000);
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="space-y-3 text-center">
            <div className="mx-auto bg-green-100 p-3 rounded-xl w-fit">
              <CheckCircle2 className="size-8 text-green-600" />
            </div>
            <CardTitle className="text-slate-900">Email envoyé!</CardTitle>
            <CardDescription>
              Vérifiez votre boîte de réception
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-slate-600">
              Nous avons envoyé un lien de réinitialisation à{' '}
              <span className="text-slate-900">{email}</span>
            </p>
            <p className="text-slate-600">
              Le lien expirera dans 24 heures. Si vous ne recevez pas l'email, vérifiez votre dossier spam.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button
              onClick={() => setSent(false)}
              variant="outline"
              className="w-full"
            >
              Renvoyer l'email
            </Button>
            <Link to="/connexion" className="w-full">
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="size-4 mr-2" />
                Retour à la connexion
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto bg-gradient-to-br from-blue-600 to-blue-700 p-3 rounded-xl w-fit">
            <Mail className="size-8 text-white" />
          </div>
          <CardTitle className="text-slate-900">Réinitialiser le mot de passe</CardTitle>
          <CardDescription>
            Entrez votre email pour recevoir un lien de réinitialisation
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Adresse e-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-blue-700">
                Un email avec un lien de réinitialisation sera envoyé à cette adresse si elle est associée à un compte.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
              {loading ? 'Envoi...' : 'Envoyer le lien'}
            </Button>
            <Link to="/connexion" className="w-full">
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="size-4 mr-2" />
                Retour à la connexion
              </Button>
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
