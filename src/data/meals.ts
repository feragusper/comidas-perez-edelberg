export type BabySafety = "safe" | "caution" | "unsafe";

export interface Meal {
  id: string;
  name: string;
  emoji: string;
  babySafety: BabySafety;
  babyNote?: string;
  category: string;
  isKeto?: boolean;
  isSide?: boolean;
}

export const MEALS: Meal[] = [
  // ── Pastas ──
  { id: "pasta", name: "Pasta", emoji: "🍝", babySafety: "safe", babyNote: "Sin sal extra", category: "Pastas" },
  { id: "lasagna", name: "Lasaña", emoji: "🫕", babySafety: "safe", babyNote: "Sin sal extra", category: "Pastas" },
  { id: "ñoquis", name: "Ñoquis", emoji: "🍝", babySafety: "safe", babyNote: "Sin sal extra", category: "Pastas" },
  // ── Carnes ──
  { id: "pollo", name: "Pollo", emoji: "🍗", babySafety: "safe", babyNote: "Desmenuzado, sin hueso", category: "Carnes", isKeto: true },
  { id: "milanesa", name: "Milanesa", emoji: "🥩", babySafety: "caution", babyNote: "Evitar apanado o sal", category: "Carnes" },
  { id: "carne", name: "Carne", emoji: "🥘", babySafety: "safe", babyNote: "Sin sal, bien tierna", category: "Carnes", isKeto: true },
  { id: "albondigas", name: "Albóndigas", emoji: "🍲", babySafety: "safe", babyNote: "Sin sal extra", category: "Carnes" },
  { id: "pescado", name: "Pescado", emoji: "🐟", babySafety: "safe", babyNote: "Sin espinas, sin sal", category: "Carnes", isKeto: true },
  { id: "salmon", name: "Salmón", emoji: "🐟", babySafety: "safe", babyNote: "Sin espinas, sin sal", category: "Carnes", isKeto: true },
  { id: "hamburguesa", name: "Hamburguesa", emoji: "🍔", babySafety: "caution", babyNote: "Solo carne sin condimentos, sin pan", category: "Carnes", isKeto: true },
  { id: "bife", name: "Bife", emoji: "🥩", babySafety: "caution", babyNote: "Muy tierno y desmenuzado", category: "Carnes", isKeto: true },
  // ── Vegetariano ──
  { id: "tortilla", name: "Tortilla", emoji: "🥚", babySafety: "safe", babyNote: "Sin sal, bien cocida", category: "Vegetariano" },
  { id: "tarta", name: "Tarta", emoji: "🥧", babySafety: "caution", babyNote: "Masa con gluten, sin sal", category: "Vegetariano" },
  { id: "risotto", name: "Risotto", emoji: "🍚", babySafety: "safe", babyNote: "Sin sal extra", category: "Vegetariano" },
  { id: "lentejas", name: "Lentejas", emoji: "🫘", babySafety: "safe", babyNote: "Sin sal, bien cocidas", category: "Vegetariano" },
  { id: "garbanzos", name: "Garbanzos", emoji: "🫘", babySafety: "caution", babyNote: "Pueden causar gases en bebés", category: "Vegetariano" },
  { id: "zapallo-relleno", name: "Zapallo relleno", emoji: "🎃", babySafety: "safe", babyNote: "Sin sal extra", category: "Vegetariano" },
  { id: "wok", name: "Wok", emoji: "🥦", babySafety: "caution", babyNote: "Sin salsa de soja (sodio alto)", category: "Vegetariano", isKeto: true },
  { id: "revuelto", name: "Revuelto", emoji: "🥚", babySafety: "safe", babyNote: "Sin sal, bien cocido", category: "Vegetariano", isKeto: true },
  // ── Sopas ──
  { id: "sopa", name: "Sopa", emoji: "🍵", babySafety: "safe", babyNote: "Sin sal, puede tomar el caldo", category: "Sopas" },
  { id: "crema", name: "Crema", emoji: "🎃", babySafety: "safe", babyNote: "Sin sal ni leche entera", category: "Sopas" },
  { id: "minestrone", name: "Minestrone", emoji: "🍲", babySafety: "safe", babyNote: "Sin sal extra", category: "Sopas" },
  // ── Especiales ──
  { id: "pizza", name: "Pizza", emoji: "🍕", babySafety: "caution", babyNote: "Solo la miga, sin sal", category: "Especiales" },
  { id: "empanadas", name: "Empanadas", emoji: "🥟", babySafety: "caution", babyNote: "Solo el relleno suave, no la masa", category: "Especiales" },

  // ── Guarniciones ──
  { id: "side-ensalada", name: "Ensalada", emoji: "🥗", babySafety: "safe", babyNote: "Sin aderezo, trozos pequeños", category: "Guarniciones", isSide: true, isKeto: true },
  { id: "side-pure", name: "Puré", emoji: "🥔", babySafety: "safe", babyNote: "Sin sal ni leche entera", category: "Guarniciones", isSide: true },
  { id: "side-verduras-vapor", name: "Verduras al vapor", emoji: "🥦", babySafety: "safe", babyNote: "Bien cocidas", category: "Guarniciones", isSide: true, isKeto: true },
  { id: "side-arroz", name: "Arroz", emoji: "🍚", babySafety: "safe", babyNote: "Sin sal extra", category: "Guarniciones", isSide: true },
  { id: "side-papas", name: "Papas", emoji: "🥔", babySafety: "safe", babyNote: "Sin sal, bien blandas", category: "Guarniciones", isSide: true },
  { id: "side-calabaza", name: "Calabaza", emoji: "🎃", babySafety: "safe", babyNote: "Sin sal", category: "Guarniciones", isSide: true, isKeto: true },
  { id: "side-tomatitos", name: "Tomatitos", emoji: "🍅", babySafety: "safe", babyNote: "Partir al medio para bebé", category: "Guarniciones", isSide: true, isKeto: true },
  { id: "side-batata", name: "Batata", emoji: "🍠", babySafety: "safe", babyNote: "Sin sal, muy nutritivo", category: "Guarniciones", isSide: true },
  { id: "side-espinaca", name: "Espinaca", emoji: "🌿", babySafety: "safe", babyNote: "Sin sal, bien cocida", category: "Guarniciones", isSide: true, isKeto: true },
  { id: "side-quinoa", name: "Quinoa", emoji: "🌾", babySafety: "safe", babyNote: "Bien lavada y cocida", category: "Guarniciones", isSide: true },
];

export const MEAL_CATEGORIES = ["Pastas", "Carnes", "Vegetariano", "Sopas", "Especiales"];

export const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export const SUNDAY_DINNER: Meal = {
  id: "pasta-domingo",
  name: "Pasta",
  emoji: "🍝",
  babySafety: "safe",
  babyNote: "Clásico familiar, apto bebé sin sal",
  category: "Pastas",
};
