export type PantryStatus = "stocked" | "last";

/** Marquita "está en Don Bacilio" que acompaña a un alimento del menú. */
export function PantryBadge({ status }: { status?: PantryStatus }) {
  if (!status) return null;
  const last = status === "last";
  return (
    <span
      className="shrink-0 text-[11px] leading-none"
      title={last
        ? "Última en Don Bacilio: se elimina de la despensa cuando pase el día"
        : "En casa (Don Bacilio)"}
      aria-label={last ? "Última en Don Bacilio" : "En casa (Don Bacilio)"}
    >
      {last ? "🏠⚠️" : "🏠"}
    </span>
  );
}
