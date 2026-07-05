import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  UtensilsCrossed,
  BarChart3,
  Carrot,
  ShoppingCart,
  LogOut,
  Warehouse,
  Menu as MenuIcon,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const items = [
  { to: "/", label: "Menú", icon: UtensilsCrossed },
  { to: "/mis-comidas", label: "Mis comidas", icon: UtensilsCrossed },
  { to: "/ingredientes", label: "Ingredientes", icon: Carrot },
  { to: "/don-bacilio", label: "Don Bacilio", icon: Warehouse },
  { to: "/super", label: "Súper", icon: ShoppingCart },
  { to: "/reportes", label: "Reportes", icon: BarChart3 },
];

export function TopNav() {
  const { pathname } = useLocation();
  const { signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const itemClass = (active: boolean) =>
    cn(
      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0",
      active
        ? "bg-primary/10 text-primary"
        : "text-muted-foreground hover:text-foreground hover:bg-muted"
    );

  // Mobile: touch target of at least 44px per item
  const mobileItemClass = (active: boolean) =>
    cn(
      "flex items-center gap-2.5 px-3 min-h-[44px] rounded-lg text-sm font-medium transition-colors",
      active
        ? "bg-primary/10 text-primary"
        : "text-muted-foreground hover:text-foreground hover:bg-muted"
    );

  return (
    <nav className="w-full bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-4 sm:px-8 h-12 flex items-center">
        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1 w-full">
          {items.map((it) => {
            const Icon = it.icon;
            const active = pathname === it.to;
            return (
              <Link key={it.to} to={it.to} className={itemClass(active)}>
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

        {/* Mobile header */}
        <div className="flex md:hidden items-center justify-between w-full">
          <Link to="/" className="text-base font-bold text-foreground tracking-tight">
            🍽️ <span className="text-gradient-gold">Menú</span>
          </Link>
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            className="flex items-center justify-center h-11 w-11 -mr-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            {open ? <X size={20} /> : <MenuIcon size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden border-t border-border bg-card/95 backdrop-blur-md">
          <div className="max-w-5xl mx-auto px-4 py-2 flex flex-col gap-1">
            {items.map((it) => {
              const Icon = it.icon;
              const active = pathname === it.to;
              return (
                <Link
                  key={it.to}
                  to={it.to}
                  onClick={() => setOpen(false)}
                  className={mobileItemClass(active)}
                >
                  <Icon size={16} /> {it.label}
                </Link>
              );
            })}
            <button
              onClick={() => {
                setOpen(false);
                signOut();
              }}
              className="flex items-center gap-2.5 px-3 min-h-[44px] rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <LogOut size={16} /> Salir
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
