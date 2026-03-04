export type BabySafety = "safe" | "caution" | "unsafe";

export interface Meal {
  id: string;
  name: string;
  emoji: string;
  babySafety: BabySafety;
  babyNote?: string;
  category: string;
}

export const MEALS: Meal[] = [
  // Pastas
  { id: "pasta-tomate", name: "Pasta con tomate", emoji: "🍝", babySafety: "safe", category: "Pastas" },
  { id: "pasta-calabaza", name: "Pasta con calabaza", emoji: "🎃", babySafety: "safe", category: "Pastas" },
  { id: "pasta-manteca", name: "Pasta con manteca", emoji: "🧈", babySafety: "safe", category: "Pastas" },
  { id: "pasta-verduras", name: "Pasta con verduras", emoji: "🥦", babySafety: "safe", category: "Pastas" },
  { id: "pasta-bolognesa", name: "Pasta a la bolognesa", emoji: "🍝", babySafety: "safe", babyNote: "Sin sal extra", category: "Pastas" },
  { id: "lasagna", name: "Lasaña", emoji: "🫕", babySafety: "safe", babyNote: "Sin sal extra", category: "Pastas" },
  // Carnes
  { id: "pollo-horno", name: "Pollo al horno", emoji: "🍗", babySafety: "safe", babyNote: "Desmenuzado, sin hueso", category: "Carnes" },
  { id: "pollo-plancha", name: "Pollo a la plancha", emoji: "🍗", babySafety: "safe", babyNote: "Desmenuzado", category: "Carnes" },
  { id: "milanesa-horno", name: "Milanesa al horno", emoji: "🥩", babySafety: "caution", babyNote: "Evitar si tiene mucho apanado o sal", category: "Carnes" },
  { id: "carne-guisada", name: "Carne guisada", emoji: "🥘", babySafety: "safe", babyNote: "Sin sal, bien tierna", category: "Carnes" },
  { id: "albondigas", name: "Albóndigas", emoji: "🍲", babySafety: "safe", babyNote: "Sin sal extra", category: "Carnes" },
  { id: "pescado-horno", name: "Pescado al horno", emoji: "🐟", babySafety: "safe", babyNote: "Sin espinas, sin sal", category: "Carnes" },
  { id: "hamburguesa", name: "Hamburguesa casera", emoji: "🍔", babySafety: "caution", babyNote: "Solo carne sin condimentos, sin pan con semillas", category: "Carnes" },
  // Vegetariano
  { id: "tortilla", name: "Tortilla de papas", emoji: "🥚", babySafety: "safe", babyNote: "Sin sal, bien cocida", category: "Vegetariano" },
  { id: "tarta-verduras", name: "Tarta de verduras", emoji: "🥧", babySafety: "caution", babyNote: "Masa con gluten, relleno OK si sin sal", category: "Vegetariano" },
  { id: "pure-papas", name: "Puré de papas", emoji: "🥔", babySafety: "safe", babyNote: "Sin sal ni leche entera (usar poca)", category: "Vegetariano" },
  { id: "risotto", name: "Risotto de verduras", emoji: "🍚", babySafety: "safe", babyNote: "Sin sal extra", category: "Vegetariano" },
  { id: "guiso-lentejas", name: "Guiso de lentejas", emoji: "🫘", babySafety: "safe", babyNote: "Sin sal, bien cocidas", category: "Vegetariano" },
  { id: "guiso-garbanzos", name: "Guiso de garbanzos", emoji: "🫘", babySafety: "caution", babyNote: "Pueden causar gases en algunos bebés", category: "Vegetariano" },
  { id: "zapallo-relleno", name: "Zapallo relleno", emoji: "🎃", babySafety: "safe", babyNote: "Sin sal extra", category: "Vegetariano" },
  { id: "wok-verduras", name: "Wok de verduras", emoji: "🥦", babySafety: "caution", babyNote: "Sin salsa de soja (sodio alto)", category: "Vegetariano" },
  // Sopas
  { id: "sopa-verduras", name: "Sopa de verduras", emoji: "🍵", babySafety: "safe", babyNote: "Sin sal, puede tomar el caldo", category: "Sopas" },
  { id: "crema-calabaza", name: "Crema de calabaza", emoji: "🎃", babySafety: "safe", category: "Sopas" },
  { id: "minestrone", name: "Minestrone", emoji: "🍲", babySafety: "safe", babyNote: "Sin sal extra", category: "Sopas" },
  // Especiales
  { id: "pizza-casera", name: "Pizza casera", emoji: "🍕", babySafety: "caution", babyNote: "Puede comer la miga sin borde crocante, sin sal", category: "Especiales" },
  { id: "empanadas", name: "Empanadas al horno", emoji: "🥟", babySafety: "caution", babyNote: "Solo el relleno suave, no la masa", category: "Especiales" },
];

export const MEAL_CATEGORIES = ["Pastas", "Carnes", "Vegetariano", "Sopas", "Especiales"];

export const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export const SUNDAY_DINNER: Meal = {
  id: "pasta-domingo",
  name: "Pasta (fijo dominical)",
  emoji: "🍝",
  babySafety: "safe",
  babyNote: "Clásico familiar, apto bebé sin sal",
  category: "Pastas",
};
