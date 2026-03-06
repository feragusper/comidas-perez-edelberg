export type BabySafety = "safe" | "caution" | "unsafe";

export interface Meal {
  id: string;
  name: string;
  emoji: string;
  babySafety: BabySafety;
  babyNote?: string;
  category: string;
  isKeto?: boolean;
  isSide?: boolean; // true = guarnición
}

export const MEALS: Meal[] = [
  // ── Pastas (main) ──
  { id: "pasta-tomate", name: "Pasta con tomate", emoji: "🍝", babySafety: "safe", category: "Pastas" },
  { id: "pasta-calabaza", name: "Pasta con calabaza", emoji: "🎃", babySafety: "safe", category: "Pastas" },
  { id: "pasta-manteca", name: "Pasta con manteca", emoji: "🧈", babySafety: "safe", category: "Pastas" },
  { id: "pasta-verduras", name: "Pasta con verduras", emoji: "🥦", babySafety: "safe", category: "Pastas" },
  { id: "pasta-bolognesa", name: "Pasta a la bolognesa", emoji: "🍝", babySafety: "safe", babyNote: "Sin sal extra", category: "Pastas" },
  { id: "lasagna", name: "Lasaña", emoji: "🫕", babySafety: "safe", babyNote: "Sin sal extra", category: "Pastas" },
  // ── Carnes (main) ──
  { id: "pollo-horno", name: "Pollo al horno", emoji: "🍗", babySafety: "safe", babyNote: "Desmenuzado, sin hueso", category: "Carnes", isKeto: true },
  { id: "pollo-plancha", name: "Pollo a la plancha", emoji: "🍗", babySafety: "safe", babyNote: "Desmenuzado", category: "Carnes", isKeto: true },
  { id: "milanesa-horno", name: "Milanesa al horno", emoji: "🥩", babySafety: "caution", babyNote: "Evitar si tiene mucho apanado o sal", category: "Carnes" },
  { id: "carne-guisada", name: "Carne guisada", emoji: "🥘", babySafety: "safe", babyNote: "Sin sal, bien tierna", category: "Carnes" },
  { id: "albondigas", name: "Albóndigas", emoji: "🍲", babySafety: "safe", babyNote: "Sin sal extra", category: "Carnes" },
  { id: "pescado-horno", name: "Pescado al horno", emoji: "🐟", babySafety: "safe", babyNote: "Sin espinas, sin sal", category: "Carnes", isKeto: true },
  { id: "hamburguesa", name: "Hamburguesa casera", emoji: "🍔", babySafety: "caution", babyNote: "Solo carne sin condimentos, sin pan con semillas", category: "Carnes", isKeto: true },
  { id: "salmon-plancha", name: "Salmón a la plancha", emoji: "🐟", babySafety: "safe", babyNote: "Sin espinas, sin sal", category: "Carnes", isKeto: true },
  { id: "bife-plancha", name: "Bife a la plancha", emoji: "🥩", babySafety: "caution", babyNote: "Muy tierno y desmenuzado", category: "Carnes", isKeto: true },
  // ── Vegetariano (main) ──
  { id: "tortilla", name: "Tortilla de papas", emoji: "🥚", babySafety: "safe", babyNote: "Sin sal, bien cocida", category: "Vegetariano" },
  { id: "tarta-verduras", name: "Tarta de verduras", emoji: "🥧", babySafety: "caution", babyNote: "Masa con gluten, relleno OK si sin sal", category: "Vegetariano" },
  { id: "pure-papas", name: "Puré de papas", emoji: "🥔", babySafety: "safe", babyNote: "Sin sal ni leche entera (usar poca)", category: "Vegetariano" },
  { id: "risotto", name: "Risotto de verduras", emoji: "🍚", babySafety: "safe", babyNote: "Sin sal extra", category: "Vegetariano" },
  { id: "guiso-lentejas", name: "Guiso de lentejas", emoji: "🫘", babySafety: "safe", babyNote: "Sin sal, bien cocidas", category: "Vegetariano" },
  { id: "guiso-garbanzos", name: "Guiso de garbanzos", emoji: "🫘", babySafety: "caution", babyNote: "Pueden causar gases en algunos bebés", category: "Vegetariano" },
  { id: "zapallo-relleno", name: "Zapallo relleno", emoji: "🎃", babySafety: "safe", babyNote: "Sin sal extra", category: "Vegetariano" },
  { id: "wok-verduras", name: "Wok de verduras", emoji: "🥦", babySafety: "caution", babyNote: "Sin salsa de soja (sodio alto)", category: "Vegetariano", isKeto: true },
  { id: "revuelto-huevos", name: "Revuelto de huevos y verduras", emoji: "🥚", babySafety: "safe", babyNote: "Sin sal, bien cocido", category: "Vegetariano", isKeto: true },
  // ── Sopas (main) ──
  { id: "sopa-verduras", name: "Sopa de verduras", emoji: "🍵", babySafety: "safe", babyNote: "Sin sal, puede tomar el caldo", category: "Sopas" },
  { id: "crema-calabaza", name: "Crema de calabaza", emoji: "🎃", babySafety: "safe", category: "Sopas" },
  { id: "minestrone", name: "Minestrone", emoji: "🍲", babySafety: "safe", babyNote: "Sin sal extra", category: "Sopas" },
  // ── Especiales (main) ──
  { id: "pizza-casera", name: "Pizza casera", emoji: "🍕", babySafety: "caution", babyNote: "Puede comer la miga sin borde crocante, sin sal", category: "Especiales" },
  { id: "empanadas", name: "Empanadas al horno", emoji: "🥟", babySafety: "caution", babyNote: "Solo el relleno suave, no la masa", category: "Especiales" },

  // ── Guarniciones ──
  { id: "side-ensalada", name: "Ensalada verde", emoji: "🥗", babySafety: "safe", babyNote: "Sin aderezo, trozos pequeños", category: "Guarniciones", isSide: true, isKeto: true },
  { id: "side-pure", name: "Puré de papas", emoji: "🥔", babySafety: "safe", babyNote: "Sin sal ni leche entera", category: "Guarniciones", isSide: true },
  { id: "side-verduras-vapor", name: "Verduras al vapor", emoji: "🥦", babySafety: "safe", babyNote: "Bien cocidas", category: "Guarniciones", isSide: true, isKeto: true },
  { id: "side-arroz", name: "Arroz blanco", emoji: "🍚", babySafety: "safe", babyNote: "Sin sal extra", category: "Guarniciones", isSide: true },
  { id: "side-papas-horno", name: "Papas al horno", emoji: "🥔", babySafety: "safe", babyNote: "Sin sal, bien blandas", category: "Guarniciones", isSide: true },
  { id: "side-calabaza-asada", name: "Calabaza asada", emoji: "🎃", babySafety: "safe", babyNote: "Sin sal", category: "Guarniciones", isSide: true, isKeto: true },
  { id: "side-tomatitos", name: "Tomatitos cherry", emoji: "🍅", babySafety: "safe", babyNote: "Partir al medio para bebé", category: "Guarniciones", isSide: true, isKeto: true },
  { id: "side-batata-puree", name: "Puré de batata", emoji: "🍠", babySafety: "safe", babyNote: "Sin sal, muy nutritivo", category: "Guarniciones", isSide: true },
  { id: "side-espinaca", name: "Espinaca salteada", emoji: "🌿", babySafety: "safe", babyNote: "Sin sal, bien cocida", category: "Guarniciones", isSide: true, isKeto: true },
  { id: "side-quinoa", name: "Quinoa", emoji: "🌾", babySafety: "safe", babyNote: "Bien lavada y cocida", category: "Guarniciones", isSide: true },
];

export const MEAL_CATEGORIES = ["Pastas", "Carnes", "Vegetariano", "Sopas", "Especiales"];
export const SIDE_CATEGORIES = ["Guarniciones"];

export const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export const SUNDAY_DINNER: Meal = {
  id: "pasta-domingo",
  name: "Pasta (fijo dominical)",
  emoji: "🍝",
  babySafety: "safe",
  babyNote: "Clásico familiar, apto bebé sin sal",
  category: "Pastas",
};
