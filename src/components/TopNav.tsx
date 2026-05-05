import { Link, useLocation } from "react-router-dom";
import { UtensilsCrossed, BarChart3, Carrot } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/mis-comidas", label: "Mis comidas", icon: UtensilsCrossed },
  { to: "/ingredientes", label: "Ingredientes", icon: Carrot },
  { to: "/reportes", label: "Reportes", icon: BarChart3 },
];

export function TopNav() {
  const { pathname } = useLocation();
  return (
    <nav className="w-full bg-card/95 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center gap-1 h-11 overflow-x-auto">
        <Link to="/" className="text-sm font-semibold text-foreground mr-3 shrink-0" style={{ fontFamily: "Fraunces, serif" }}>
          🍽️ Menú
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
      </div>
    </nav>
  );
}
