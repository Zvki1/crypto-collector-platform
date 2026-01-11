import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Users, Activity, AlertCircle, CheckCircle2, XCircle, Search, Shield } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AdminPageProps {
  user: any;
}

const mockUsers = [
  { id: '1', name: 'Jean Dupont', email: 'jean.dupont@email.com', role: 'user', status: 'active', lastLogin: '2025-11-23', transactions: 45 },
  { id: '2', name: 'Marie Martin', email: 'marie.martin@email.com', role: 'user', status: 'active', lastLogin: '2025-11-22', transactions: 32 },
  { id: '3', name: 'Pierre Bernard', email: 'pierre.bernard@email.com', role: 'user', status: 'inactive', lastLogin: '2025-11-15', transactions: 12 },
  { id: '4', name: 'Sophie Dubois', email: 'sophie.dubois@email.com', role: 'admin', status: 'active', lastLogin: '2025-11-23', transactions: 78 },
  { id: '5', name: 'Luc Lambert', email: 'luc.lambert@email.com', role: 'user', status: 'suspended', lastLogin: '2025-11-10', transactions: 5 },
];

const mockLogs = [
  { id: '1', timestamp: '2025-11-23 14:32:15', user: 'jean.dupont@email.com', action: 'Connexion', status: 'success', ip: '192.168.1.1' },
  { id: '2', timestamp: '2025-11-23 14:28:03', user: 'marie.martin@email.com', action: 'Achat BTC', status: 'success', ip: '192.168.1.5' },
  { id: '3', timestamp: '2025-11-23 14:15:22', user: 'sophie.dubois@email.com', action: 'Modification alerte', status: 'success', ip: '192.168.1.10' },
  { id: '4', timestamp: '2025-11-23 13:45:11', user: 'pierre.bernard@email.com', action: 'Connexion', status: 'failed', ip: '192.168.1.25' },
  { id: '5', timestamp: '2025-11-23 13:30:44', user: 'luc.lambert@email.com', action: 'Vente ETH', status: 'success', ip: '192.168.1.8' },
];

const activityData = [
  { date: '17 Nov', users: 145, transactions: 234, alerts: 89 },
  { date: '18 Nov', users: 152, transactions: 267, alerts: 95 },
  { date: '19 Nov', users: 138, transactions: 198, alerts: 76 },
  { date: '20 Nov', users: 165, transactions: 312, alerts: 102 },
  { date: '21 Nov', users: 171, transactions: 289, alerts: 88 },
  { date: '22 Nov', users: 158, transactions: 245, alerts: 91 },
  { date: '23 Nov', users: 183, transactions: 334, alerts: 118 },
];

export default function AdminPage({ user }: AdminPageProps) {
  const [searchUser, setSearchUser] = useState('');
  const [searchLog, setSearchLog] = useState('');

  if (user?.role !== 'admin') {
    return (
      <div className="max-w-7xl mx-auto">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <XCircle className="size-6 text-red-600 flex-shrink-0" />
              <div>
                <p className="text-red-900">Accès refusé</p>
                <p className="text-red-700 mt-1">
                  Vous n'avez pas les permissions nécessaires pour accéder à cette page. 
                  Seuls les administrateurs peuvent consulter cette section.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredUsers = mockUsers.filter(u =>
    u.name.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.email.toLowerCase().includes(searchUser.toLowerCase())
  );

  const filteredLogs = mockLogs.filter(log =>
    log.user.toLowerCase().includes(searchLog.toLowerCase()) ||
    log.action.toLowerCase().includes(searchLog.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
          <Shield className="size-6" />
        </div>
        <div>
          <h1 className="text-slate-900">Administration</h1>
          <p className="text-slate-600">Gestion des utilisateurs et monitoring de la plateforme</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-slate-600">Utilisateurs totaux</p>
                <p className="text-slate-900">1,247</p>
                <p className="text-green-600">+12% ce mois</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                <Users className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-slate-600">Utilisateurs actifs</p>
                <p className="text-slate-900">892</p>
                <p className="text-green-600">71.5%</p>
              </div>
              <div className="p-2 rounded-lg bg-green-100 text-green-600">
                <CheckCircle2 className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-slate-600">Transactions (24h)</p>
                <p className="text-slate-900">334</p>
                <p className="text-green-600">+8% vs hier</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                <Activity className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-slate-600">Alertes actives</p>
                <p className="text-slate-900">2,156</p>
                <p className="text-orange-600">+23 nouvelles</p>
              </div>
              <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
                <AlertCircle className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Activité des utilisateurs</CardTitle>
            <CardDescription>Nombre d'utilisateurs actifs par jour</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
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
                <Area 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  fill="url(#colorUsers)"
                  name="Utilisateurs"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transactions & Alertes</CardTitle>
            <CardDescription>Volume quotidien des opérations</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={activityData}>
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
                <Bar dataKey="transactions" fill="#8b5cf6" name="Transactions" />
                <Bar dataKey="alerts" fill="#f59e0b" name="Alertes" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Users and Logs Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="logs">Journaux d'activité</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                  <CardTitle>Gestion des utilisateurs</CardTitle>
                  <CardDescription>Liste complète des utilisateurs ({mockUsers.length})</CardDescription>
                </div>
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <Input
                    placeholder="Rechercher un utilisateur..."
                    value={searchUser}
                    onChange={(e) => setSearchUser(e.target.value)}
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
                      <TableHead>Nom</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Rôle</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Dernière connexion</TableHead>
                      <TableHead className="text-right">Transactions</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="text-slate-900">{user.name}</TableCell>
                        <TableCell className="text-slate-600">{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className={user.role === 'admin' ? 'bg-purple-100 text-purple-700' : ''}>
                            {user.role === 'admin' ? 'Admin' : 'Utilisateur'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              user.status === 'active' ? 'default' :
                              user.status === 'inactive' ? 'secondary' : 'destructive'
                            }
                            className={
                              user.status === 'active' ? 'bg-green-100 text-green-700' :
                              user.status === 'inactive' ? 'bg-slate-100 text-slate-600' : 'bg-red-100 text-red-700'
                            }
                          >
                            {user.status === 'active' ? 'Actif' : user.status === 'inactive' ? 'Inactif' : 'Suspendu'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {new Date(user.lastLogin).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell className="text-right text-slate-900">
                          {user.transactions}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm">Voir</Button>
                            <Button variant="ghost" size="sm" className="text-orange-600">Modifier</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                  <CardTitle>Journaux d'activité</CardTitle>
                  <CardDescription>Historique des actions de la plateforme</CardDescription>
                </div>
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <Input
                    placeholder="Rechercher dans les logs..."
                    value={searchLog}
                    onChange={(e) => setSearchLog(e.target.value)}
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
                      <TableHead>Horodatage</TableHead>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Adresse IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-slate-600">{log.timestamp}</TableCell>
                        <TableCell className="text-slate-900">{log.user}</TableCell>
                        <TableCell className="text-slate-900">{log.action}</TableCell>
                        <TableCell>
                          <Badge
                            variant={log.status === 'success' ? 'default' : 'destructive'}
                            className={log.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
                          >
                            {log.status === 'success' ? 'Succès' : 'Échec'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-600">{log.ip}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>État du système</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <p className="text-green-900">API</p>
                <p className="text-green-700">Opérationnel</p>
              </div>
              <CheckCircle2 className="size-5 text-green-600" />
            </div>
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <p className="text-green-900">Base de données</p>
                <p className="text-green-700">Opérationnel</p>
              </div>
              <CheckCircle2 className="size-5 text-green-600" />
            </div>
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <p className="text-green-900">Serveur</p>
                <p className="text-green-700">Opérationnel</p>
              </div>
              <CheckCircle2 className="size-5 text-green-600" />
            </div>
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <p className="text-green-900">Alertes</p>
                <p className="text-green-700">Opérationnel</p>
              </div>
              <CheckCircle2 className="size-5 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
