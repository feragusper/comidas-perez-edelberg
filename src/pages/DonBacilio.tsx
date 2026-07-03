import { useState } from "react";
import { TopNav } from "@/components/TopNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePantry } from "@/hooks/usePantry";
import { supabase } from "@/integrations/supabase/client";
import { searchEmojis } from "@/data/foodEmojis";
import { EmojiPicker } from "@/components/EmojiPicker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, X, Sparkles, Loader2, Warehouse } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Suggestion {
  name: string;
  emoji: string;
  description: string;
  isKeto?: boolean;
}

function guessEmoji(name: string): string {
  const results = searchEmojis(name);
  return results[0]?.emoji ?? "🥫";
}

export default function DonBacilio() {
  const { items, addItem, removeItem } = usePantry();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🥫");
  const [emojiTouched, setEmojiTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  const handleNameChange = (v: string) => {
    setName(v);
    if (!emojiTouched) setEmoji(guessEmoji(v));
  };

  const handleAdd = () => {
    if (!name.trim()) return;
    addItem({ name: name.trim(), emoji });
    setName("");
    setEmoji("🥫");
    setEmojiTouched(false);
  };

  const handleGenerate = async () => {
    if (items.length === 0) {
      toast({ title: "Agregá algo a la despensa primero", variant: "destructive" });
      return;
    }
    setLoading(true);
    setSuggestions([]);
    try {
      const { data, error } = await supabase.functions.invoke("suggest-from-ingredients", {
        body: { ingredients: items.map((i) => i.name) },
      });
      if (error) throw error;
      if (data?.error) {
        toast({
          title: data.error === "RATE_LIMITED" ? "Demasiadas peticiones" : "Sin créditos disponibles",
          description: "Probá de nuevo en un rato.",
          variant: "destructive",
        });
        return;
      }
      setSuggestions(Array.isArray(data?.suggestions) ? data.suggestions : []);
    } catch (e) {
      console.error(e);
      toast({ title: "Error generando sugerencias", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <div className="px-4 sm:px-8 py-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-1">
          <Warehouse className="text-primary" size={22} />
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "Playfair Display, serif" }}>
            Don Bacilio
          </h1>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          Lo que ya tenemos en casa. Se usa para las sugerencias y para marcar lo que ya tenés en la lista del súper.
        </p>

        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <button className="shrink-0 w-11 h-11 rounded-lg border border-border bg-card text-xl flex items-center justify-center hover:border-primary/50 transition-colors">
                {emoji}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <EmojiPicker
                value={emoji}
                onSelect={(e) => { setEmoji(e); setEmojiTouched(true); }}
              />
            </PopoverContent>
          </Popover>
          <Input
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
            placeholder="pollo congelado, fideos, cus cus…"
            className="flex-1"
          />
          <Button onClick={handleAdd} disabled={!name.trim()} className="shrink-0">
            <Plus size={16} className="mr-1" /> Agregar
          </Button>
        </div>

        <div className="mt-5">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8 border border-dashed border-border rounded-xl">
              Todavía no cargaste nada. Agregá lo que tenés en la despensa o el freezer.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {items.map((it) => (
                <span
                  key={it.name}
                  className="inline-flex items-center gap-1.5 bg-muted/60 rounded-full pl-3 pr-1.5 py-1.5 text-sm text-foreground"
                >
                  <span>{it.emoji}</span>
                  <span>{it.name}</span>
                  <button
                    onClick={() => removeItem(it.name)}
                    className="ml-0.5 p-0.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    aria-label={`Quitar ${it.name}`}
                  >
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <Button
          onClick={handleGenerate}
          disabled={loading || items.length === 0}
          className="w-full mt-6"
        >
          {loading ? (
            <><Loader2 size={16} className="animate-spin mr-2" /> Generando…</>
          ) : (
            <><Sparkles size={16} className="mr-2" /> Sugerir comidas con lo que tenemos</>
          )}
        </Button>

        {suggestions.length > 0 && (
          <div className="mt-6 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Ideas con la despensa</h2>
            {suggestions.map((s, idx) => (
              <div key={idx} className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card">
                <span className="text-2xl shrink-0">{s.emoji}</span>
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{s.name}</p>
                  <p className="text-sm text-muted-foreground">{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
