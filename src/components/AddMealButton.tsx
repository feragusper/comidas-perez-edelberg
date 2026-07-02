import { Plus } from "lucide-react";

interface AddMealButtonProps {
  onClick: () => void;
}

export function AddMealButton({ onClick }: AddMealButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 text-xs text-muted-foreground border border-dashed border-border rounded-lg px-3 py-2 hover:border-primary/50 hover:text-primary hover:bg-muted/40 transition-all"
    >
      <Plus size={13} /> Elegir alimento
    </button>
  );
}
