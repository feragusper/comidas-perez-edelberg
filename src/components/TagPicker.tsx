import { TAXONOMY, parseTag, makeTag, categoryOf } from "@/data/foodTaxonomy";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { ChevronDown, ChevronRight, X } from "lucide-react";

interface Props {
  value: string[];
  onChange: (tags: string[]) => void;
  compact?: boolean;
}

export function TagPicker({ value, onChange, compact = false }: Props) {
  const [openCat, setOpenCat] = useState<string | null>(null);

  const toggle = (tag: string) => {
    if (value.includes(tag)) {
      onChange(value.filter((t) => t !== tag));
    } else {
      onChange([...value, tag]);
    }
  };

  return (
    <div className="space-y-2">
      {/* Selected tags chips */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag) => {
            const parsed = parseTag(tag);
            if (!parsed) return null;
            const cat = categoryOf(parsed.category);
            return (
              <span
                key={tag}
                className={cn(
                  "inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium",
                  cat?.bg ?? "bg-muted",
                  cat?.color ?? "text-foreground"
                )}
              >
                <span>{cat?.emoji}</span>
                <span>{parsed.sub}</span>
                <button onClick={() => toggle(tag)} className="hover:opacity-70">
                  <X size={10} />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Categories */}
      <div className="space-y-1">
        {TAXONOMY.map((cat) => {
          const isOpen = openCat === cat.id;
          const selectedInCat = value.filter((t) => t.startsWith(cat.id + "/")).length;
          return (
            <div key={cat.id} className="border border-border rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenCat(isOpen ? null : cat.id)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors",
                  selectedInCat > 0 && cat.bg
                )}
              >
                <span className="flex items-center gap-2">
                  <span>{cat.emoji}</span>
                  <span className={cn("font-medium", selectedInCat > 0 && cat.color)}>{cat.label}</span>
                  {selectedInCat > 0 && (
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-semibold", cat.color, "bg-white/60")}>
                      {selectedInCat}
                    </span>
                  )}
                </span>
                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              {isOpen && (
                <div className={cn("flex flex-wrap gap-1.5 p-2 border-t border-border bg-muted/20", compact && "p-1.5")}>
                  {cat.subcategories.map((sub) => {
                    const tag = makeTag(cat.id, sub.id);
                    const selected = value.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggle(tag)}
                        className={cn(
                          "text-xs px-2.5 py-1 rounded-full border transition-all",
                          selected
                            ? cn(cat.bg, cat.color, "border-transparent font-medium")
                            : "bg-card text-muted-foreground border-border hover:border-foreground/30"
                        )}
                      >
                        {sub.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
