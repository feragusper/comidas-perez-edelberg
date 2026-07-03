import { Link, useLocation } from "react-router-dom";
import { UtensilsCrossed, BarChart3, Carrot, ShoppingCart, LogOut, Warehouse } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const items = [
  { to: "/mis-comidas", label: "Mis comidas", icon: UtensilsCrossed },
  { to: "/ingredientes", label: "Ingredientes", icon: Carrot },
  { to: "/don-bacilio", label: "Don Bacilio", icon: Warehouse },
  { to: "/super", label: "Súper", icon: ShoppingCart },
  { to: "/reportes", label: "Reportes", icon: BarChart3 },
];

export function TopNav() {
  const { pathname } = useLocation();
  const { signOut } = useAuth();
  return (
    <nav className="w-full bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center gap-1 h-12 overflow-x-auto scrollbar-hide">
        <Link to="/" className="font-display text-base font-bold text-foreground mr-3 shrink-0 tracking-tight">
          🍽️ <span className="text-gradient-gold">Menú</span>
        </Link>
        {items.map((it) => {
          const Icon = it.icon;
          const active = pathname === it.to;
          return (
            <Link
              key={it.to}
              to={it.to}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon size={13} /> {it.label}
            </Link>
          );
        })}
        <button
          onClick={signOut}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
        >
          <LogOut size={13} /> Salir
        </button>
      </div>
    </nav>
  );
}
