// Taxonomía de categorías/subcategorías para clasificar comidas.
// Formato de tag: "Categoría/Subcategoría"

export interface Subcategory {
  id: string;
  label: string;
}

export interface Category {
  id: string;
  label: string;
  emoji: string;
  color: string; // tailwind text color class
  bg: string;    // tailwind bg color class (suave)
  bar: string;   // tailwind bg color class (intenso, para barras)
  subcategories: Subcategory[];
}

export const TAXONOMY: Category[] = [
  {
    id: "Carbohidratos",
    label: "Carbohidratos",
    emoji: "🍞",
    color: "text-amber-700",
    bg: "bg-amber-100",
    bar: "bg-amber-500",
    subcategories: [
      { id: "Pasta", label: "Pasta" },
      { id: "Pan", label: "Pan" },
      { id: "Arroz", label: "Arroz" },
      { id: "Patata", label: "Patata" },
      { id: "Legumbres", label: "Legumbres" },
      { id: "Cereales", label: "Cereales" },
      { id: "Masas", label: "Masas / Pizza / Empanadas" },
    ],
  },
  {
    id: "Proteína",
    label: "Proteína",
    emoji: "🥩",
    color: "text-rose-700",
    bg: "bg-rose-100",
    bar: "bg-rose-500",
    subcategories: [
      { id: "Vaca", label: "Vaca / Ternera" },
      { id: "Cerdo", label: "Cerdo" },
      { id: "Pollo", label: "Pollo" },
      { id: "Pavo", label: "Pavo" },
      { id: "Pescado", label: "Pescado" },
      { id: "Marisco", label: "Marisco" },
      { id: "Huevo", label: "Huevo" },
      { id: "Vegetal", label: "Proteína vegetal (tofu, legumbre)" },
    ],
  },
  {
    id: "Verdura",
    label: "Verdura",
    emoji: "🥦",
    color: "text-emerald-700",
    bg: "bg-emerald-100",
    bar: "bg-emerald-500",
    subcategories: [
      { id: "Hojas verdes", label: "Hojas verdes" },
      { id: "Tubérculos", label: "Tubérculos / Raíces" },
      { id: "Crucíferas", label: "Crucíferas (brócoli, coliflor)" },
      { id: "Solanáceas", label: "Solanáceas (tomate, berenjena)" },
      { id: "Calabaza", label: "Calabazas / Zapallos" },
      { id: "Setas", label: "Setas" },
      { id: "Otras", label: "Otras verduras" },
    ],
  },
  {
    id: "Fruta",
    label: "Fruta",
    emoji: "🍎",
    color: "text-pink-700",
    bg: "bg-pink-100",
    bar: "bg-pink-500",
    subcategories: [
      { id: "Cítricos", label: "Cítricos" },
      { id: "Tropical", label: "Tropical" },
      { id: "Bosque", label: "Frutos del bosque" },
      { id: "Hueso", label: "Hueso (durazno, ciruela)" },
      { id: "Pomácea", label: "Manzana / Pera" },
      { id: "Aguacate", label: "Aguacate" },
    ],
  },
  {
    id: "Lácteo",
    label: "Lácteo",
    emoji: "🧀",
    color: "text-yellow-700",
    bg: "bg-yellow-100",
    bar: "bg-yellow-500",
    subcategories: [
      { id: "Leche", label: "Leche / Yogur" },
      { id: "Queso", label: "Queso" },
      { id: "Crema", label: "Crema / Mantequilla" },
    ],
  },
  {
    id: "Otros",
    label: "Otros",
    emoji: "🍽️",
    color: "text-slate-700",
    bg: "bg-slate-100",
    bar: "bg-slate-500",
    subcategories: [
      { id: "Sopa", label: "Sopa / Caldo" },
      { id: "Salsa", label: "Salsa" },
      { id: "Snack", label: "Snack" },
      { id: "Dulce", label: "Dulce / Postre" },
      { id: "Bebida", label: "Bebida" },
      { id: "Especial", label: "Especial (delivery, restaurante)" },
    ],
  },
];

export const ALL_CATEGORY_IDS = TAXONOMY.map((c) => c.id);

export function makeTag(category: string, sub: string): string {
  return `${category}/${sub}`;
}

export function parseTag(tag: string): { category: string; sub: string } | null {
  const idx = tag.indexOf("/");
  if (idx <= 0) return null;
  return { category: tag.slice(0, idx), sub: tag.slice(idx + 1) };
}

export function categoryOf(catId: string): Category | undefined {
  return TAXONOMY.find((c) => c.id === catId);
}
