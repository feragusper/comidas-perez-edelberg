import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "collapsed_groups_v1";

function readCollapsed(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function writeCollapsed(id: string, collapsed: boolean) {
  const map = readCollapsed();
  if (collapsed) map[id] = true;
  else delete map[id];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch { /* storage lleno o bloqueado: el estado queda solo en memoria */ }
}

interface CollapsibleGroupProps {
  /** Clave estable para recordar el estado colapsado entre sesiones (p.ej. "picker:Pastas"). */
  id: string;
  title: React.ReactNode;
  count?: number;
  /** Fuerza el grupo abierto (p.ej. mientras hay una búsqueda activa). */
  forceOpen?: boolean;
  /** Estilos del botón del título (hereda tipografía del contexto). */
  headerClassName?: string;
  /** Estilos de la fila completa del header (fondo, padding). */
  rowClassName?: string;
  /** Contenido extra a la derecha del header (no colapsa, p.ej. acciones). */
  headerRight?: React.ReactNode;
  chevronSize?: number;
  children: React.ReactNode;
}

/**
 * Grupo colapsable genérico para listados de comidas/ingredientes.
 * El estado se persiste por id en localStorage.
 */
export function CollapsibleGroup({
  id,
  title,
  count,
  forceOpen = false,
  headerClassName,
  rowClassName,
  headerRight,
  chevronSize = 13,
  children,
}: CollapsibleGroupProps) {
  const [collapsed, setCollapsed] = useState<boolean>(() => readCollapsed()[id] ?? false);
  const isOpen = forceOpen || !collapsed;

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      writeCollapsed(id, next);
      return next;
    });
  };

  return (
    <div>
      <div className={cn("flex items-center gap-2", rowClassName)}>
        <button
          type="button"
          onClick={toggle}
          className={cn("flex items-center gap-1.5 flex-1 min-w-0 text-left", headerClassName)}
        >
          {isOpen
            ? <ChevronDown size={chevronSize} className="text-muted-foreground shrink-0" />
            : <ChevronRight size={chevronSize} className="text-muted-foreground shrink-0" />}
          <span className="truncate">{title}</span>
          {count !== undefined && (
            <span className="text-[10px] font-normal text-muted-foreground shrink-0">({count})</span>
          )}
        </button>
        {headerRight}
      </div>
      {isOpen && children}
    </div>
  );
}
