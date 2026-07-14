import { Link } from "react-router-dom";
import { Usage } from "@/lib/mealPlanUsage";

/**
 * Chips con los usos históricos de una comida/ingrediente. Los del entorno
 * actual linkean al menú de esa semana para corregir/reemplazar/borrar ahí;
 * los del otro entorno se muestran como etiqueta plana (stage y prod comparten DB).
 */
export function UsageChips({ usages, currentEnv }: { usages: Usage[]; currentEnv: Usage["env"] }) {
  const MAX = 5;
  if (usages.length === 0) return null;
  const shown = usages.slice(0, MAX);
  const rest = usages.length - shown.length;
  return (
    <div className="flex flex-wrap items-center gap-1 mt-1.5">
      {shown.map((u, i) => {
        const label = `${u.weekKey} · ${u.day} · ${u.slot}`;
        return u.env === currentEnv ? (
          <Link
            key={i}
            to={`/?week=${u.weekKey}`}
            className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            title="Ver en el menú de esa semana"
          >
            {label}
          </Link>
        ) : (
          <span
            key={i}
            className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground"
            title={`Usada en ${u.env} — cambiá de entorno para editarla`}
          >
            {label} ({u.env})
          </span>
        );
      })}
      {rest > 0 && <span className="text-[10px] text-muted-foreground">+{rest} más</span>}
    </div>
  );
}
