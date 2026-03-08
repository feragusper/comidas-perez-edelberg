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
  { id: "pasta-carbonara", name: "Pasta carbonara", emoji: "🍝", babySafety: "caution", babyNote: "Yema cruda, evitar", category: "Pastas" },
  { id: "pasta-boloñesa", name: "Pasta boloñesa", emoji: "🍝", babySafety: "safe", babyNote: "Sin sal extra, carne bien cocida", category: "Pastas" },
  { id: "pasta-pesto", name: "Pasta al pesto", emoji: "🍝", babySafety: "safe", babyNote: "Sin sal extra", category: "Pastas" },
  { id: "canelones", name: "Canelones", emoji: "🫕", babySafety: "safe", babyNote: "Sin sal extra", category: "Pastas" },
  { id: "macarrones", name: "Macarrones al horno", emoji: "🍝", babySafety: "safe", babyNote: "Sin sal extra", category: "Pastas" },
  { id: "espaguetis-almejas", name: "Espaguetis con almejas", emoji: "🐚", babySafety: "unsafe", babyNote: "Marisco, evitar en menores de 2 años", category: "Pastas" },

  // ── Carnes ──
  { id: "pollo", name: "Pollo asado", emoji: "🍗", babySafety: "safe", babyNote: "Desmenuzado, sin hueso", category: "Carnes", isKeto: true },
  { id: "pollo-plancha", name: "Pollo a la plancha", emoji: "🍗", babySafety: "safe", babyNote: "Desmenuzado, sin sal", category: "Carnes", isKeto: true },
  { id: "pollo-curry", name: "Pollo al curry", emoji: "🍛", babySafety: "caution", babyNote: "Las especias pueden irritar, adaptar", category: "Carnes" },
  { id: "pollo-limon", name: "Pollo al limón", emoji: "🍋", babySafety: "safe", babyNote: "Sin sal extra", category: "Carnes", isKeto: true },
  { id: "milanesa", name: "Milanesa", emoji: "🥩", babySafety: "caution", babyNote: "Evitar apanado o sal", category: "Carnes" },
  { id: "carne", name: "Carne guisada", emoji: "🥘", babySafety: "safe", babyNote: "Sin sal, bien tierna", category: "Carnes", isKeto: true },
  { id: "albondigas", name: "Albóndigas", emoji: "🍲", babySafety: "safe", babyNote: "Sin sal extra", category: "Carnes" },
  { id: "pescado", name: "Pescado al horno", emoji: "🐟", babySafety: "safe", babyNote: "Sin espinas, sin sal", category: "Carnes", isKeto: true },
  { id: "salmon", name: "Salmón", emoji: "🐟", babySafety: "safe", babyNote: "Sin espinas, sin sal", category: "Carnes", isKeto: true },
  { id: "salmon-horno", name: "Salmón al horno con limón", emoji: "🐟", babySafety: "safe", babyNote: "Sin espinas, sin sal", category: "Carnes", isKeto: true },
  { id: "hamburguesa", name: "Hamburguesa", emoji: "🍔", babySafety: "caution", babyNote: "Solo carne sin condimentos, sin pan", category: "Carnes", isKeto: true },
  { id: "bife", name: "Filete de ternera", emoji: "🥩", babySafety: "caution", babyNote: "Muy tierno y desmenuzado", category: "Carnes", isKeto: true },
  { id: "cerdo-horno", name: "Lomo de cerdo al horno", emoji: "🥩", babySafety: "safe", babyNote: "Bien cocido, sin sal", category: "Carnes", isKeto: true },
  { id: "costillas", name: "Costillas BBQ", emoji: "🥩", babySafety: "caution", babyNote: "Salsa con mucho sodio, evitar", category: "Carnes" },
  { id: "cocido", name: "Cocido madrileño", emoji: "🍲", babySafety: "safe", babyNote: "Sin sal, verduras y legumbres bien cocidas", category: "Carnes" },
  { id: "estofado", name: "Estofado de ternera", emoji: "🫕", babySafety: "safe", babyNote: "Sin sal, bien tierno", category: "Carnes", isKeto: true },
  { id: "merluza", name: "Merluza a la romana", emoji: "🐟", babySafety: "caution", babyNote: "Cuidado rebozado y sal", category: "Carnes" },
  { id: "merluza-vapor", name: "Merluza al vapor", emoji: "🐟", babySafety: "safe", babyNote: "Sin espinas, sin sal", category: "Carnes", isKeto: true },
  { id: "dorada", name: "Dorada al horno", emoji: "🐠", babySafety: "safe", babyNote: "Sin espinas, sin sal", category: "Carnes", isKeto: true },
  { id: "lubina", name: "Lubina a la sal", emoji: "🐠", babySafety: "caution", babyNote: "Mucho sodio, adaptar sin sal", category: "Carnes", isKeto: true },
  { id: "atun", name: "Atún con tomate", emoji: "🐟", babySafety: "safe", babyNote: "Sin sal extra", category: "Carnes", isKeto: true },
  { id: "pollo-verduras", name: "Salteado de pollo con verduras", emoji: "🍗", babySafety: "safe", babyNote: "Sin sal, verduras bien cocidas", category: "Carnes", isKeto: true },
  { id: "pavo-plancha", name: "Pechuga de pavo", emoji: "🦃", babySafety: "safe", babyNote: "Sin sal, bien cocida", category: "Carnes", isKeto: true },
  { id: "croquetas", name: "Croquetas", emoji: "🧆", babySafety: "caution", babyNote: "Rebozado y sal, adaptar el relleno", category: "Carnes" },
  { id: "calamares", name: "Calamares", emoji: "🦑", babySafety: "unsafe", babyNote: "Marisco, evitar hasta 2 años", category: "Carnes" },
  { id: "gambas", name: "Gambas al ajillo", emoji: "🍤", babySafety: "unsafe", babyNote: "Marisco, evitar hasta 2 años", category: "Carnes" },

  // ── Vegetariano / Huevos ──
  { id: "tortilla", name: "Tortilla de patatas", emoji: "🥚", babySafety: "safe", babyNote: "Sin sal, bien cocida", category: "Vegetariano" },
  { id: "tortilla-verduras", name: "Tortilla de verduras", emoji: "🥚", babySafety: "safe", babyNote: "Sin sal, bien cocida", category: "Vegetariano" },
  { id: "tarta", name: "Tarta salada", emoji: "🥧", babySafety: "caution", babyNote: "Masa con gluten, sin sal", category: "Vegetariano" },
  { id: "quiche", name: "Quiche lorraine", emoji: "🥧", babySafety: "caution", babyNote: "Lacteos y gluten, porciones pequeñas", category: "Vegetariano" },
  { id: "risotto", name: "Risotto", emoji: "🍚", babySafety: "safe", babyNote: "Sin sal extra", category: "Vegetariano" },
  { id: "lentejas", name: "Lentejas", emoji: "🫘", babySafety: "safe", babyNote: "Sin sal, bien cocidas", category: "Vegetariano" },
  { id: "garbanzos", name: "Garbanzos con espinacas", emoji: "🫘", babySafety: "caution", babyNote: "Pueden causar gases en bebés", category: "Vegetariano" },
  { id: "judias-verdes", name: "Judías verdes con patata", emoji: "🫘", babySafety: "safe", babyNote: "Sin sal, bien cocidas", category: "Vegetariano" },
  { id: "pisto", name: "Pisto manchego", emoji: "🥘", babySafety: "safe", babyNote: "Sin sal, bien cocinado", category: "Vegetariano" },
  { id: "revuelto", name: "Revuelto de champiñones", emoji: "🥚", babySafety: "safe", babyNote: "Sin sal, bien cocido", category: "Vegetariano", isKeto: true },
  { id: "wok", name: "Wok de verduras", emoji: "🥦", babySafety: "caution", babyNote: "Sin salsa de soja (sodio alto)", category: "Vegetariano", isKeto: true },
  { id: "berenjenas-rellenas", name: "Berenjenas rellenas", emoji: "🍆", babySafety: "safe", babyNote: "Sin sal, bien cocidas", category: "Vegetariano" },
  { id: "pimientos-rellenos", name: "Pimientos rellenos", emoji: "🫑", babySafety: "safe", babyNote: "Sin sal extra", category: "Vegetariano" },
  { id: "pure-verduras", name: "Crema de verduras", emoji: "🎃", babySafety: "safe", babyNote: "Sin sal ni leche entera", category: "Vegetariano" },
  { id: "hummus-veggies", name: "Bowl de hummus y verduras", emoji: "🥙", babySafety: "caution", babyNote: "Tahini con frutos secos, precaución", category: "Vegetariano", isKeto: true },
  { id: "falafel", name: "Falafel", emoji: "🧆", babySafety: "caution", babyNote: "Especias, introducir con cuidado", category: "Vegetariano" },
  { id: "tofu-salteado", name: "Tofu salteado", emoji: "🥢", babySafety: "safe", babyNote: "Sin sal, sin salsa de soja", category: "Vegetariano", isKeto: true },

  // ── Sopas y Cremas ──
  { id: "sopa", name: "Sopa de fideos", emoji: "🍜", babySafety: "safe", babyNote: "Sin sal, puede tomar el caldo", category: "Sopas" },
  { id: "crema", name: "Crema de calabaza", emoji: "🎃", babySafety: "safe", babyNote: "Sin sal ni leche entera", category: "Sopas" },
  { id: "crema-zanahoria", name: "Crema de zanahoria", emoji: "🥕", babySafety: "safe", babyNote: "Sin sal, nutritiva", category: "Sopas" },
  { id: "crema-brocoli", name: "Crema de brócoli", emoji: "🥦", babySafety: "safe", babyNote: "Sin sal, bien licuada", category: "Sopas" },
  { id: "gazpacho", name: "Gazpacho", emoji: "🍅", babySafety: "caution", babyNote: "Crudo, esperar a 12 meses", category: "Sopas", isKeto: true },
  { id: "salmorejo", name: "Salmorejo", emoji: "🍅", babySafety: "caution", babyNote: "Crudo y sal alta, adaptar", category: "Sopas" },
  { id: "minestrone", name: "Minestrone", emoji: "🍲", babySafety: "safe", babyNote: "Sin sal extra", category: "Sopas" },
  { id: "caldo-pollo", name: "Caldo de pollo", emoji: "🍵", babySafety: "safe", babyNote: "Sin sal, excelente para bebés", category: "Sopas" },
  { id: "sopa-rabo", name: "Sopa de rabo de ternera", emoji: "🍲", babySafety: "safe", babyNote: "Sin sal, muy nutritiva", category: "Sopas" },
  { id: "vichyssoise", name: "Vichyssoise", emoji: "🥛", babySafety: "caution", babyNote: "Lácteos, frío puede ser difícil", category: "Sopas" },

  // ── Arroces ──
  { id: "paella", name: "Paella", emoji: "🥘", babySafety: "caution", babyNote: "Marisco, evitar hasta 2 años", category: "Arroces" },
  { id: "arroz-pollo", name: "Arroz con pollo", emoji: "🍗", babySafety: "safe", babyNote: "Sin sal extra, arroz bien cocido", category: "Arroces" },
  { id: "arroz-verduras", name: "Arroz con verduras", emoji: "🍚", babySafety: "safe", babyNote: "Sin sal, bien cocido", category: "Arroces" },
  { id: "arroz-negro", name: "Arroz negro", emoji: "🦑", babySafety: "unsafe", babyNote: "Tinta de calamar, evitar", category: "Arroces" },
  { id: "arroz-leche", name: "Arroz con leche", emoji: "🍚", babySafety: "caution", babyNote: "Lacteos y azúcar, pequeñas cantidades", category: "Arroces" },

  // ── Especiales ──
  { id: "pizza", name: "Pizza casera", emoji: "🍕", babySafety: "caution", babyNote: "Solo la miga, sin sal", category: "Especiales" },
  { id: "empanadas", name: "Empanadillas", emoji: "🥟", babySafety: "caution", babyNote: "Solo el relleno suave, no la masa", category: "Especiales" },
  { id: "bocadillo", name: "Bocadillo", emoji: "🥖", babySafety: "caution", babyNote: "Pan con gluten, relleno sin sal", category: "Especiales" },
  { id: "wrap", name: "Wrap de pollo", emoji: "🌯", babySafety: "safe", babyNote: "Sin sal, relleno bien cocinado", category: "Especiales" },
  { id: "cesar", name: "Ensalada César", emoji: "🥗", babySafety: "caution", babyNote: "Anchoas y sal alta, adaptar", category: "Especiales", isKeto: true },
  { id: "buddha-bowl", name: "Buddha bowl", emoji: "🥙", babySafety: "safe", babyNote: "Sin sal, ingredientes frescos", category: "Especiales", isKeto: true },
  { id: "tabule", name: "Tabule", emoji: "🌿", babySafety: "safe", babyNote: "Sin sal extra, grano bien cocido", category: "Especiales" },
  { id: "fondue", name: "Fondue de queso", emoji: "🫕", babySafety: "unsafe", babyNote: "Queso curado y alcohol, evitar", category: "Especiales" },

  // ── Guarniciones ──
  { id: "side-ensalada", name: "Ensalada", emoji: "🥗", babySafety: "safe", babyNote: "Sin aderezo, trozos pequeños", category: "Guarniciones", isSide: true, isKeto: true },
  { id: "side-ensalada-mixta", name: "Ensalada mixta", emoji: "🥗", babySafety: "safe", babyNote: "Sin aderezo, trozos pequeños", category: "Guarniciones", isSide: true, isKeto: true },
  { id: "side-pure", name: "Puré de patata", emoji: "🥔", babySafety: "safe", babyNote: "Sin sal ni leche entera", category: "Guarniciones", isSide: true },
  { id: "side-verduras-vapor", name: "Verduras al vapor", emoji: "🥦", babySafety: "safe", babyNote: "Bien cocidas", category: "Guarniciones", isSide: true, isKeto: true },
  { id: "side-verduras-horno", name: "Verduras al horno", emoji: "🫑", babySafety: "safe", babyNote: "Sin sal, bien blandas", category: "Guarniciones", isSide: true, isKeto: true },
  { id: "side-arroz", name: "Arroz blanco", emoji: "🍚", babySafety: "safe", babyNote: "Sin sal extra", category: "Guarniciones", isSide: true },
  { id: "side-papas", name: "Patatas fritas", emoji: "🍟", babySafety: "caution", babyNote: "Mucho aceite y sal, evitar", category: "Guarniciones", isSide: true },
  { id: "side-papas-horno", name: "Patatas al horno", emoji: "🥔", babySafety: "safe", babyNote: "Sin sal, bien blandas", category: "Guarniciones", isSide: true },
  { id: "side-calabaza", name: "Calabaza asada", emoji: "🎃", babySafety: "safe", babyNote: "Sin sal", category: "Guarniciones", isSide: true, isKeto: true },
  { id: "side-tomatitos", name: "Tomatitos cherry", emoji: "🍅", babySafety: "safe", babyNote: "Partir al medio para bebé", category: "Guarniciones", isSide: true, isKeto: true },
  { id: "side-batata", name: "Boniato asado", emoji: "🍠", babySafety: "safe", babyNote: "Sin sal, muy nutritivo", category: "Guarniciones", isSide: true },
  { id: "side-espinaca", name: "Espinacas salteadas", emoji: "🌿", babySafety: "safe", babyNote: "Sin sal, bien cocida", category: "Guarniciones", isSide: true, isKeto: true },
  { id: "side-quinoa", name: "Quinoa", emoji: "🌾", babySafety: "safe", babyNote: "Bien lavada y cocida", category: "Guarniciones", isSide: true },
  { id: "side-brocoli", name: "Brócoli", emoji: "🥦", babySafety: "safe", babyNote: "Sin sal, bien cocido en florets", category: "Guarniciones", isSide: true, isKeto: true },
  { id: "side-zanahoria", name: "Zanahorias", emoji: "🥕", babySafety: "safe", babyNote: "Cocidas y blandas para bebé", category: "Guarniciones", isSide: true, isKeto: true },
  { id: "side-champinones", name: "Champiñones salteados", emoji: "🍄", babySafety: "safe", babyNote: "Sin sal, bien cocinados", category: "Guarniciones", isSide: true, isKeto: true },
  { id: "side-col-lombarda", name: "Col lombarda", emoji: "🥬", babySafety: "safe", babyNote: "Sin sal, bien cocinada", category: "Guarniciones", isSide: true, isKeto: true },
  { id: "side-cous-cous", name: "Cous cous", emoji: "🌾", babySafety: "safe", babyNote: "Sin sal extra", category: "Guarniciones", isSide: true },
  { id: "side-pan", name: "Pan", emoji: "🍞", babySafety: "caution", babyNote: "Gluten, porciones pequeñas", category: "Guarniciones", isSide: true },
  { id: "side-judias-verdes", name: "Judías verdes", emoji: "🫛", babySafety: "safe", babyNote: "Sin sal, bien cocidas", category: "Guarniciones", isSide: true, isKeto: true },
  { id: "side-pisto", name: "Pisto", emoji: "🥘", babySafety: "safe", babyNote: "Sin sal, bien cocinado", category: "Guarniciones", isSide: true },
  { id: "side-aguacate", name: "Aguacate", emoji: "🥑", babySafety: "safe", babyNote: "Excelente para bebés, en puré", category: "Guarniciones", isSide: true, isKeto: true },
];

export const MEAL_CATEGORIES = ["Pastas", "Carnes", "Vegetariano", "Arroces", "Sopas", "Especiales"];

export const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export const SUNDAY_DINNER: Meal = {
  id: "pasta-domingo",
  name: "Pasta",
  emoji: "🍝",
  babySafety: "safe",
  babyNote: "Clásico familiar, apto bebé sin sal",
  category: "Pastas",
};
