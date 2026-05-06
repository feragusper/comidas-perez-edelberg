import { useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { searchEmojis } from "@/data/foodEmojis";

interface EmojiPickerProps {
  value?: string;
  onSelect: (emoji: string) => void;
  gridClassName?: string;
  buttonClassName?: string;
  placeholder?: string;
}

export function EmojiPicker({
  value,
  onSelect,
  gridClassName = "grid grid-cols-8 gap-1.5",
  buttonClassName = "text-2xl p-2 rounded-xl transition-all hover:bg-muted",
  placeholder = "Buscar (ej: pollo, queso)...",
}: EmojiPickerProps) {
  const [query, setQuery] = useState("");
  const results = searchEmojis(query);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-8 pr-3 py-2 rounded-lg bg-muted border-0 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
        />
      </div>
      {results.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">Sin resultados para "{query}"</p>
      ) : (
        <div className={gridClassName}>
          {results.map(({ emoji }) => (
            <button
              key={emoji}
              onClick={() => onSelect(emoji)}
              className={cn(
                buttonClassName,
                value === emoji && "bg-primary/15 ring-2 ring-primary/40"
              )}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
