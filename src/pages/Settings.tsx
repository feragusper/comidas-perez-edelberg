import { TopNav } from "@/components/TopNav";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { usePlanRules } from "@/hooks/usePlanRules";
import type { PlanRules } from "@/lib/planRules";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface RuleDef<K extends keyof PlanRules> {
  key: K;
  title: string;
  description: string;
  options: { value: PlanRules[K]; label: string }[];
}

const RULES: [RuleDef<"lunch">, RuleDef<"babyLunch">, RuleDef<"babyDinner">] = [
  {
    key: "lunch",
    title: "Nuestro almuerzo",
    description: "Se completa solo; siempre se puede cambiar a mano en el menú.",
    options: [
      { value: "prevDinner", label: "Es nuestra cena del día anterior" },
      { value: "none", label: "No sugerir nada" },
    ],
  },
  {
    key: "babyLunch",
    title: "Almuerzo de Nico",
    description: "Solo se copian comidas caseras aptas para Nico.",
    options: [
      { value: "prevDinner", label: "Es nuestra cena del día anterior" },
      { value: "none", label: "No sugerir nada" },
    ],
  },
  {
    key: "babyDinner",
    title: "Cena de Nico",
    description: "Solo se copian comidas caseras aptas para Nico.",
    options: [
      { value: "sameDinner", label: "Es nuestra cena del mismo día" },
      { value: "prevDinner", label: "Es nuestra cena del día anterior" },
      { value: "none", label: "No sugerir nada" },
    ],
  },
];

export default function Settings() {
  const { rules, loading, saving, saveRules } = usePlanRules();

  const change = async <K extends keyof PlanRules>(key: K, value: PlanRules[K]) => {
    try {
      await saveRules({ ...rules, [key]: value });
    } catch (e) {
      console.error(e);
      toast({ title: "No se pudo guardar la regla", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="max-w-2xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            Ajustes {saving && <Loader2 size={16} className="animate-spin text-muted-foreground" />}
          </h1>
          <p className="text-sm text-muted-foreground">
            Reglas que completan el menú automáticamente. Los cambios aplican a todas las semanas
            en los lugares que no editaste a mano.
          </p>
        </header>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-muted-foreground" /></div>
        ) : (
          RULES.map((rule) => (
            <section key={rule.key} className="rounded-lg border border-border bg-card p-4 space-y-3">
              <div>
                <h2 className="text-sm font-semibold text-foreground">{rule.title}</h2>
                <p className="text-xs text-muted-foreground">{rule.description}</p>
              </div>
              <RadioGroup
                value={rules[rule.key]}
                onValueChange={(v) => change(rule.key, v as PlanRules[typeof rule.key])}
                className="gap-2"
              >
                {rule.options.map((opt) => {
                  const id = `${rule.key}-${opt.value}`;
                  return (
                    <div key={opt.value} className="flex items-center gap-2 min-h-[36px]">
                      <RadioGroupItem value={opt.value} id={id} />
                      <Label htmlFor={id} className="font-normal cursor-pointer">{opt.label}</Label>
                    </div>
                  );
                })}
              </RadioGroup>
            </section>
          ))
        )}
      </main>
    </div>
  );
}
