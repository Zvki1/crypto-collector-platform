import { Outlet, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Bitcoin,
  Bell,
  Wallet,
  LineChart,
  Users,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback } from "./ui/avatar";

interface LayoutProps {
  user: any;
  onLogout: () => void;
}

export default function Layout({ user, onLogout }: LayoutProps) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    {
      name: "Tableau de bord",
      path: "/tableau-de-bord",
      icon: LayoutDashboard,
    },
    { name: "Cryptomonnaies", path: "/cryptomonnaies", icon: Bitcoin },
    { name: "Alertes", path: "/alertes", icon: Bell },
    { name: "Portefeuille", path: "/portefeuille", icon: Wallet },
    { name: "Prévisions", path: "/previsions", icon: LineChart },
  ];

  if (user?.role === "admin") {
    navigation.push({ name: "Administration", path: "/admin", icon: Users });
  }

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2 rounded-lg">
                <Bitcoin className="size-6 text-white" />
              </div>
              <span className="text-slate-900">CryptoMonitor</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      isActive(item.path)
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className="size-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors">
                    <Avatar className="size-8">
                      <AvatarFallback className="bg-blue-100 text-blue-700">
                        {user?.username?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline text-slate-700">
                      {user?.username || "Utilisateur"}
                    </span>
                    <ChevronDown className="size-4 text-slate-500" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 z-50">
                  <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profil" className="w-full cursor-pointer">
                      Profil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    Paramètres
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={onLogout}
                    className="text-red-600 cursor-pointer"
                  >
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="size-5" />
                ) : (
                  <Menu className="size-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="lg:hidden border-t border-slate-200 px-4 py-3 bg-white">
            <div className="flex flex-col gap-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive(item.path)
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className="size-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
