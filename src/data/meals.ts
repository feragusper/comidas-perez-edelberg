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
  /** Tags formato "Categoría/Subcategoría" — ver foodTaxonomy.ts */
  tags?: string[];
  /**
   * Comida o ingrediente suelto (una fruta como merienda, etc.).
   * Los snapshots históricos de meal_plan no traen kind: ausente = comida.
   */
  kind?: "meal" | "ingredient";
  /** Ingredientes que componen la comida (ingredients.ingredient_id). Vacío = sin normalizar. */
  ingredientIds?: string[];
}

// Helper para mantener tags concisas
const T = (...tags: string[]) => tags;

export const MEALS: Meal[] = [
  // ── Pastas ──
  { id: "pasta", name: "Pasta", emoji: "🍝", babySafety: "safe", babyNote: "Sin sal extra", category: "Pastas", tags: T("Carbohidratos/Pasta") },
  { id: "lasagna", name: "Lasaña", emoji: "🫕", babySafety: "safe", babyNote: "Sin sal extra", category: "Pastas", tags: T("Carbohidratos/Pasta", "Proteína/Vaca", "Lácteo/Queso") },
  { id: "ñoquis", name: "Ñoquis", emoji: "🍝", babySafety: "safe", babyNote: "Sin sal extra", category: "Pastas", tags: T("Carbohidratos/Pasta", "Carbohidratos/Patata") },
  { id: "pasta-carbonara", name: "Pasta carbonara", emoji: "🍝", babySafety: "caution", babyNote: "Yema cruda, evitar", category: "Pastas", tags: T("Carbohidratos/Pasta", "Proteína/Cerdo", "Proteína/Huevo") },
  { id: "pasta-boloñesa", name: "Pasta boloñesa", emoji: "🍝", babySafety: "safe", babyNote: "Sin sal extra, carne bien cocida", category: "Pastas", tags: T("Carbohidratos/Pasta", "Proteína/Vaca") },
  { id: "pasta-pesto", name: "Pasta al pesto", emoji: "🍝", babySafety: "safe", babyNote: "Sin sal extra", category: "Pastas", tags: T("Carbohidratos/Pasta", "Verdura/Hojas verdes") },
  { id: "canelones", name: "Canelones", emoji: "🫕", babySafety: "safe", babyNote: "Sin sal extra", category: "Pastas", tags: T("Carbohidratos/Pasta", "Proteína/Vaca", "Lácteo/Queso") },
  { id: "macarrones", name: "Macarrones al horno", emoji: "🍝", babySafety: "safe", babyNote: "Sin sal extra", category: "Pastas", tags: T("Carbohidratos/Pasta", "Lácteo/Queso") },
  { id: "espaguetis-almejas", name: "Espaguetis con almejas", emoji: "🐚", babySafety: "unsafe", babyNote: "Marisco, evitar en menores de 2 años", category: "Pastas", tags: T("Carbohidratos/Pasta", "Proteína/Marisco") },

  // ── Carnes ──
  { id: "pollo", name: "Pollo asado", emoji: "🍗", babySafety: "safe", babyNote: "Desmenuzado, sin hueso", category: "Carnes", isKeto: true, tags: T("Proteína/Pollo") },
  { id: "pollo-plancha", name: "Pollo a la plancha", emoji: "🍗", babySafety: "safe", babyNote: "Desmenuzado, sin sal", category: "Carnes", isKeto: true, tags: T("Proteína/Pollo") },
  { id: "pollo-curry", name: "Pollo al curry", emoji: "🍛", babySafety: "caution", babyNote: "Las especias pueden irritar, adaptar", category: "Carnes", tags: T("Proteína/Pollo") },
  { id: "pollo-limon", name: "Pollo al limón", emoji: "🍋", babySafety: "safe", babyNote: "Sin sal extra", category: "Carnes", isKeto: true, tags: T("Proteína/Pollo", "Fruta/Cítricos") },
  { id: "milanesa", name: "Milanesa", emoji: "🥩", babySafety: "caution", babyNote: "Evitar apanado o sal", category: "Carnes", tags: T("Proteína/Vaca", "Carbohidratos/Pan") },
  { id: "carne", name: "Carne guisada", emoji: "🥘", babySafety: "safe", babyNote: "Sin sal, bien tierna", category: "Carnes", isKeto: true, tags: T("Proteína/Vaca") },
  { id: "albondigas", name: "Albóndigas", emoji: "🍲", babySafety: "safe", babyNote: "Sin sal extra", category: "Carnes", tags: T("Proteína/Vaca") },
  { id: "pescado", name: "Pescado al horno", emoji: "🐟", babySafety: "safe", babyNote: "Sin espinas, sin sal", category: "Carnes", isKeto: true, tags: T("Proteína/Pescado") },
  { id: "salmon", name: "Salmón", emoji: "🐟", babySafety: "safe", babyNote: "Sin espinas, sin sal", category: "Carnes", isKeto: true, tags: T("Proteína/Pescado") },
  { id: "salmon-horno", name: "Salmón al horno con limón", emoji: "🐟", babySafety: "safe", babyNote: "Sin espinas, sin sal", category: "Carnes", isKeto: true, tags: T("Proteína/Pescado", "Fruta/Cítricos") },
  { id: "hamburguesa", name: "Hamburguesa", emoji: "🍔", babySafety: "caution", babyNote: "Solo carne sin condimentos, sin pan", category: "Carnes", isKeto: true, tags: T("Proteína/Vaca", "Carbohidratos/Pan") },
  { id: "bife", name: "Filete de ternera", emoji: "🥩", babySafety: "caution", babyNote: "Muy tierno y desmenuzado", category: "Carnes", isKeto: true, tags: T("Proteína/Vaca") },
  { id: "cerdo-horno", name: "Lomo de cerdo al horno", emoji: "🥩", babySafety: "safe", babyNote: "Bien cocido, sin sal", category: "Carnes", isKeto: true, tags: T("Proteína/Cerdo") },
  { id: "costillas", name: "Costillas BBQ", emoji: "🥩", babySafety: "caution", babyNote: "Salsa con mucho sodio, evitar", category: "Carnes", tags: T("Proteína/Cerdo") },
  { id: "cocido", name: "Cocido madrileño", emoji: "🍲", babySafety: "safe", babyNote: "Sin sal, verduras y legumbres bien cocidas", category: "Carnes", tags: T("Proteína/Vaca", "Carbohidratos/Legumbres", "Verdura/Otras") },
  { id: "estofado", name: "Estofado de ternera", emoji: "🫕", babySafety: "safe", babyNote: "Sin sal, bien tierno", category: "Carnes", isKeto: true, tags: T("Proteína/Vaca") },
  { id: "merluza", name: "Merluza a la romana", emoji: "🐟", babySafety: "caution", babyNote: "Cuidado rebozado y sal", category: "Carnes", tags: T("Proteína/Pescado") },
  { id: "merluza-vapor", name: "Merluza al vapor", emoji: "🐟", babySafety: "safe", babyNote: "Sin espinas, sin sal", category: "Carnes", isKeto: true, tags: T("Proteína/Pescado") },
  { id: "dorada", name: "Dorada al horno", emoji: "🐠", babySafety: "safe", babyNote: "Sin espinas, sin sal", category: "Carnes", isKeto: true, tags: T("Proteína/Pescado") },
  { id: "lubina", name: "Lubina a la sal", emoji: "🐠", babySafety: "caution", babyNote: "Mucho sodio, adaptar sin sal", category: "Carnes", isKeto: true, tags: T("Proteína/Pescado") },
  { id: "atun", name: "Atún con tomate", emoji: "🐟", babySafety: "safe", babyNote: "Sin sal extra", category: "Carnes", isKeto: true, tags: T("Proteína/Pescado", "Verdura/Solanáceas") },
  { id: "pollo-verduras", name: "Salteado de pollo con verduras", emoji: "🍗", babySafety: "safe", babyNote: "Sin sal, verduras bien cocidas", category: "Carnes", isKeto: true, tags: T("Proteína/Pollo", "Verdura/Otras") },
  { id: "pavo-plancha", name: "Pechuga de pavo", emoji: "🦃", babySafety: "safe", babyNote: "Sin sal, bien cocida", category: "Carnes", isKeto: true, tags: T("Proteína/Pavo") },
  { id: "croquetas", name: "Croquetas", emoji: "🧆", babySafety: "caution", babyNote: "Rebozado y sal, adaptar el relleno", category: "Carnes", tags: T("Carbohidratos/Pan", "Lácteo/Leche") },
  { id: "calamares", name: "Calamares", emoji: "🦑", babySafety: "unsafe", babyNote: "Marisco, evitar hasta 2 años", category: "Carnes", tags: T("Proteína/Marisco") },
  { id: "gambas", name: "Gambas al ajillo", emoji: "🍤", babySafety: "unsafe", babyNote: "Marisco, evitar hasta 2 años", category: "Carnes", tags: T("Proteína/Marisco") },

  // ── Vegetariano / Huevos ──
  { id: "tortilla", name: "Tortilla de patatas", emoji: "🥚", babySafety: "safe", babyNote: "Sin sal, bien cocida", category: "Vegetariano", tags: T("Proteína/Huevo", "Carbohidratos/Patata") },
  { id: "tortilla-verduras", name: "Tortilla de verduras", emoji: "🥚", babySafety: "safe", babyNote: "Sin sal, bien cocida", category: "Vegetariano", tags: T("Proteína/Huevo", "Verdura/Otras") },
  { id: "tarta", name: "Tarta salada", emoji: "🥧", babySafety: "caution", babyNote: "Masa con gluten, sin sal", category: "Vegetariano", tags: T("Carbohidratos/Masas", "Proteína/Huevo") },
  { id: "quiche", name: "Quiche lorraine", emoji: "🥧", babySafety: "caution", babyNote: "Lacteos y gluten, porciones pequeñas", category: "Vegetariano", tags: T("Carbohidratos/Masas", "Proteína/Huevo", "Lácteo/Queso") },
  { id: "risotto", name: "Risotto", emoji: "🍚", babySafety: "safe", babyNote: "Sin sal extra", category: "Vegetariano", tags: T("Carbohidratos/Arroz", "Lácteo/Queso") },
  { id: "lentejas", name: "Lentejas", emoji: "🫘", babySafety: "safe", babyNote: "Sin sal, bien cocidas", category: "Vegetariano", tags: T("Carbohidratos/Legumbres", "Proteína/Vegetal") },
  { id: "garbanzos", name: "Garbanzos con espinacas", emoji: "🫘", babySafety: "caution", babyNote: "Pueden causar gases en bebés", category: "Vegetariano", tags: T("Carbohidratos/Legumbres", "Proteína/Vegetal", "Verdura/Hojas verdes") },
  { id: "judias-verdes", name: "Judías verdes con patata", emoji: "🫘", babySafety: "safe", babyNote: "Sin sal, bien cocidas", category: "Vegetariano", tags: T("Verdura/Otras", "Carbohidratos/Patata") },
  { id: "pisto", name: "Pisto manchego", emoji: "🥘", babySafety: "safe", babyNote: "Sin sal, bien cocinado", category: "Vegetariano", tags: T("Verdura/Solanáceas") },
  { id: "revuelto", name: "Revuelto de champiñones", emoji: "🥚", babySafety: "safe", babyNote: "Sin sal, bien cocido", category: "Vegetariano", isKeto: true, tags: T("Proteína/Huevo", "Verdura/Setas") },
  { id: "wok", name: "Wok de verduras", emoji: "🥦", babySafety: "caution", babyNote: "Sin salsa de soja (sodio alto)", category: "Vegetariano", isKeto: true, tags: T("Verdura/Otras") },
  { id: "berenjenas-rellenas", name: "Berenjenas rellenas", emoji: "🍆", babySafety: "safe", babyNote: "Sin sal, bien cocidas", category: "Vegetariano", tags: T("Verdura/Solanáceas") },
  { id: "pimientos-rellenos", name: "Pimientos rellenos", emoji: "🫑", babySafety: "safe", babyNote: "Sin sal extra", category: "Vegetariano", tags: T("Verdura/Solanáceas", "Carbohidratos/Arroz") },
  { id: "pure-verduras", name: "Crema de verduras", emoji: "🎃", babySafety: "safe", babyNote: "Sin sal ni leche entera", category: "Vegetariano", tags: T("Verdura/Otras", "Otros/Sopa") },
  { id: "hummus-veggies", name: "Bowl de hummus y verduras", emoji: "🥙", babySafety: "caution", babyNote: "Tahini con frutos secos, precaución", category: "Vegetariano", isKeto: true, tags: T("Carbohidratos/Legumbres", "Verdura/Otras") },
  { id: "falafel", name: "Falafel", emoji: "🧆", babySafety: "caution", babyNote: "Especias, introducir con cuidado", category: "Vegetariano", tags: T("Carbohidratos/Legumbres", "Proteína/Vegetal") },
  { id: "tofu-salteado", name: "Tofu salteado", emoji: "🥢", babySafety: "safe", babyNote: "Sin sal, sin salsa de soja", category: "Vegetariano", isKeto: true, tags: T("Proteína/Vegetal", "Verdura/Otras") },

  // ── Sopas y Cremas ──
  { id: "sopa", name: "Sopa de fideos", emoji: "🍜", babySafety: "safe", babyNote: "Sin sal, puede tomar el caldo", category: "Sopas", tags: T("Otros/Sopa", "Carbohidratos/Pasta") },
  { id: "crema", name: "Crema de calabaza", emoji: "🎃", babySafety: "safe", babyNote: "Sin sal ni leche entera", category: "Sopas", tags: T("Otros/Sopa", "Verdura/Calabaza") },
  { id: "crema-zanahoria", name: "Crema de zanahoria", emoji: "🥕", babySafety: "safe", babyNote: "Sin sal, nutritiva", category: "Sopas", tags: T("Otros/Sopa", "Verdura/Tubérculos") },
  { id: "crema-brocoli", name: "Crema de brócoli", emoji: "🥦", babySafety: "safe", babyNote: "Sin sal, bien licuada", category: "Sopas", tags: T("Otros/Sopa", "Verdura/Crucíferas") },
  { id: "gazpacho", name: "Gazpacho", emoji: "🍅", babySafety: "caution", babyNote: "Crudo, esperar a 12 meses", category: "Sopas", isKeto: true, tags: T("Otros/Sopa", "Verdura/Solanáceas") },
  { id: "salmorejo", name: "Salmorejo", emoji: "🍅", babySafety: "caution", babyNote: "Crudo y sal alta, adaptar", category: "Sopas", tags: T("Otros/Sopa", "Verdura/Solanáceas", "Carbohidratos/Pan") },
  { id: "minestrone", name: "Minestrone", emoji: "🍲", babySafety: "safe", babyNote: "Sin sal extra", category: "Sopas", tags: T("Otros/Sopa", "Verdura/Otras", "Carbohidratos/Pasta") },
  { id: "caldo-pollo", name: "Caldo de pollo", emoji: "🍵", babySafety: "safe", babyNote: "Sin sal, excelente para bebés", category: "Sopas", tags: T("Otros/Sopa", "Proteína/Pollo") },
  { id: "sopa-rabo", name: "Sopa de rabo de ternera", emoji: "🍲", babySafety: "safe", babyNote: "Sin sal, muy nutritiva", category: "Sopas", tags: T("Otros/Sopa", "Proteína/Vaca") },
  { id: "vichyssoise", name: "Vichyssoise", emoji: "🥛", babySafety: "caution", babyNote: "Lácteos, frío puede ser difícil", category: "Sopas", tags: T("Otros/Sopa", "Verdura/Tubérculos", "Lácteo/Crema") },

  // ── Arroces ──
  { id: "paella", name: "Paella", emoji: "🥘", babySafety: "caution", babyNote: "Marisco, evitar hasta 2 años", category: "Arroces", tags: T("Carbohidratos/Arroz", "Proteína/Marisco") },
  { id: "arroz-pollo", name: "Arroz con pollo", emoji: "🍗", babySafety: "safe", babyNote: "Sin sal extra, arroz bien cocido", category: "Arroces", tags: T("Carbohidratos/Arroz", "Proteína/Pollo") },
  { id: "arroz-verduras", name: "Arroz con verduras", emoji: "🍚", babySafety: "safe", babyNote: "Sin sal, bien cocido", category: "Arroces", tags: T("Carbohidratos/Arroz", "Verdura/Otras") },
  { id: "arroz-negro", name: "Arroz negro", emoji: "🦑", babySafety: "unsafe", babyNote: "Tinta de calamar, evitar", category: "Arroces", tags: T("Carbohidratos/Arroz", "Proteína/Marisco") },
  { id: "arroz-leche", name: "Arroz con leche", emoji: "🍚", babySafety: "caution", babyNote: "Lacteos y azúcar, pequeñas cantidades", category: "Arroces", tags: T("Carbohidratos/Arroz", "Lácteo/Leche", "Otros/Dulce") },

  // ── Especiales ──
  { id: "delivery", name: "Delivery", emoji: "🛵", babySafety: "caution", babyNote: "Comida de pedido, adaptar para bebé", category: "Especiales", tags: T("Otros/Especial") },
  { id: "takeaway", name: "Takeaway", emoji: "🥡", babySafety: "caution", babyNote: "Comida para llevar, adaptar para bebé", category: "Especiales", tags: T("Otros/Especial") },
  { id: "restaurante", name: "Restaurante", emoji: "🍽️", babySafety: "caution", babyNote: "Comemos afuera, adaptar para bebé", category: "Especiales", tags: T("Otros/Especial") },
  { id: "pizza", name: "Pizza casera", emoji: "🍕", babySafety: "caution", babyNote: "Solo la miga, sin sal", category: "Especiales", tags: T("Carbohidratos/Masas", "Lácteo/Queso") },
  { id: "empanadas", name: "Empanadillas", emoji: "🥟", babySafety: "caution", babyNote: "Solo el relleno suave, no la masa", category: "Especiales", tags: T("Carbohidratos/Masas", "Proteína/Vaca") },
  { id: "bocadillo", name: "Bocadillo", emoji: "🥖", babySafety: "caution", babyNote: "Pan con gluten, relleno sin sal", category: "Especiales", tags: T("Carbohidratos/Pan") },
  { id: "wrap", name: "Wrap de pollo", emoji: "🌯", babySafety: "safe", babyNote: "Sin sal, relleno bien cocinado", category: "Especiales", tags: T("Carbohidratos/Masas", "Proteína/Pollo") },
  { id: "cesar", name: "Ensalada César", emoji: "🥗", babySafety: "caution", babyNote: "Anchoas y sal alta, adaptar", category: "Especiales", isKeto: true, tags: T("Verdura/Hojas verdes", "Proteína/Pollo") },
  { id: "buddha-bowl", name: "Buddha bowl", emoji: "🥙", babySafety: "safe", babyNote: "Sin sal, ingredientes frescos", category: "Especiales", isKeto: true, tags: T("Verdura/Otras", "Proteína/Vegetal") },
  { id: "tabule", name: "Tabule", emoji: "🌿", babySafety: "safe", babyNote: "Sin sal extra, grano bien cocido", category: "Especiales", tags: T("Carbohidratos/Cereales", "Verdura/Hojas verdes") },
  { id: "fondue", name: "Fondue de queso", emoji: "🫕", babySafety: "unsafe", babyNote: "Queso curado y alcohol, evitar", category: "Especiales", tags: T("Lácteo/Queso") },

  // ── Guarniciones ──
  { id: "side-ensalada", name: "Ensalada", emoji: "🥗", babySafety: "safe", babyNote: "Sin aderezo, trozos pequeños", category: "Guarniciones", isSide: true, isKeto: true, tags: T("Verdura/Hojas verdes") },
  { id: "side-ensalada-mixta", name: "Ensalada mixta", emoji: "🥗", babySafety: "safe", babyNote: "Sin aderezo, trozos pequeños", category: "Guarniciones", isSide: true, isKeto: true, tags: T("Verdura/Hojas verdes") },
  { id: "side-pure", name: "Puré de patata", emoji: "🥔", babySafety: "safe", babyNote: "Sin sal ni leche entera", category: "Guarniciones", isSide: true, tags: T("Carbohidratos/Patata") },
  { id: "side-verduras-vapor", name: "Verduras al vapor", emoji: "🥦", babySafety: "safe", babyNote: "Bien cocidas", category: "Guarniciones", isSide: true, isKeto: true, tags: T("Verdura/Otras") },
  { id: "side-verduras-horno", name: "Verduras al horno", emoji: "🫑", babySafety: "safe", babyNote: "Sin sal, bien blandas", category: "Guarniciones", isSide: true, isKeto: true, tags: T("Verdura/Otras") },
  { id: "side-arroz", name: "Arroz blanco", emoji: "🍚", babySafety: "safe", babyNote: "Sin sal extra", category: "Guarniciones", isSide: true, tags: T("Carbohidratos/Arroz") },
  { id: "side-papas", name: "Patatas fritas", emoji: "🍟", babySafety: "caution", babyNote: "Mucho aceite y sal, evitar", category: "Guarniciones", isSide: true, tags: T("Carbohidratos/Patata") },
  { id: "side-papas-horno", name: "Patatas al horno", emoji: "🥔", babySafety: "safe", babyNote: "Sin sal, bien blandas", category: "Guarniciones", isSide: true, tags: T("Carbohidratos/Patata") },
  { id: "side-calabaza", name: "Calabaza asada", emoji: "🎃", babySafety: "safe", babyNote: "Sin sal", category: "Guarniciones", isSide: true, isKeto: true, tags: T("Verdura/Calabaza") },
  { id: "side-tomatitos", name: "Tomatitos cherry", emoji: "🍅", babySafety: "safe", babyNote: "Partir al medio para bebé", category: "Guarniciones", isSide: true, isKeto: true, tags: T("Verdura/Solanáceas") },
  { id: "side-batata", name: "Boniato asado", emoji: "🍠", babySafety: "safe", babyNote: "Sin sal, muy nutritivo", category: "Guarniciones", isSide: true, tags: T("Verdura/Tubérculos") },
  { id: "side-espinaca", name: "Espinacas salteadas", emoji: "🌿", babySafety: "safe", babyNote: "Sin sal, bien cocida", category: "Guarniciones", isSide: true, isKeto: true, tags: T("Verdura/Hojas verdes") },
  { id: "side-quinoa", name: "Quinoa", emoji: "🌾", babySafety: "safe", babyNote: "Bien lavada y cocida", category: "Guarniciones", isSide: true, tags: T("Carbohidratos/Cereales") },
  { id: "side-brocoli", name: "Brócoli", emoji: "🥦", babySafety: "safe", babyNote: "Sin sal, bien cocido en florets", category: "Guarniciones", isSide: true, isKeto: true, tags: T("Verdura/Crucíferas") },
  { id: "side-zanahoria", name: "Zanahorias", emoji: "🥕", babySafety: "safe", babyNote: "Cocidas y blandas para bebé", category: "Guarniciones", isSide: true, isKeto: true, tags: T("Verdura/Tubérculos") },
  { id: "side-champinones", name: "Champiñones salteados", emoji: "🍄", babySafety: "safe", babyNote: "Sin sal, bien cocinados", category: "Guarniciones", isSide: true, isKeto: true, tags: T("Verdura/Setas") },
  { id: "side-col-lombarda", name: "Col lombarda", emoji: "🥬", babySafety: "safe", babyNote: "Sin sal, bien cocinada", category: "Guarniciones", isSide: true, isKeto: true, tags: T("Verdura/Crucíferas") },
  { id: "side-cous-cous", name: "Cous cous", emoji: "🌾", babySafety: "safe", babyNote: "Sin sal extra", category: "Guarniciones", isSide: true, tags: T("Carbohidratos/Cereales") },
  { id: "side-pan", name: "Pan", emoji: "🍞", babySafety: "caution", babyNote: "Gluten, porciones pequeñas", category: "Guarniciones", isSide: true, tags: T("Carbohidratos/Pan") },
  { id: "side-judias-verdes", name: "Judías verdes", emoji: "🫛", babySafety: "safe", babyNote: "Sin sal, bien cocidas", category: "Guarniciones", isSide: true, isKeto: true, tags: T("Verdura/Otras") },
  { id: "side-pisto", name: "Pisto", emoji: "🥘", babySafety: "safe", babyNote: "Sin sal, bien cocinado", category: "Guarniciones", isSide: true, tags: T("Verdura/Solanáceas") },
  { id: "side-aguacate", name: "Aguacate", emoji: "🥑", babySafety: "safe", babyNote: "Excelente para bebés, en puré", category: "Guarniciones", isSide: true, isKeto: true, tags: T("Fruta/Aguacate") },

  // ── Desayunos ──
  { id: "des-avena", name: "Avena con fruta", emoji: "🥣", babySafety: "safe", babyNote: "Sin azúcar, fruta blanda", category: "Desayunos", tags: T("Carbohidratos/Cereales", "Fruta/Otras") },
  { id: "des-yogur", name: "Yogur con fruta", emoji: "🥛", babySafety: "safe", babyNote: "Yogur natural sin azúcar", category: "Desayunos", tags: T("Lácteo/Yogur", "Fruta/Otras") },
  { id: "des-tostada-aguacate", name: "Tostada con aguacate", emoji: "🥑", babySafety: "caution", babyNote: "Pan con gluten, en trozos pequeños", category: "Desayunos", tags: T("Carbohidratos/Pan", "Fruta/Aguacate") },
  { id: "des-tortitas", name: "Tortitas de avena", emoji: "🥞", babySafety: "safe", babyNote: "Sin azúcar añadido", category: "Desayunos", tags: T("Carbohidratos/Cereales") },
  { id: "des-fruta", name: "Fruta variada", emoji: "🍓", babySafety: "safe", babyNote: "En trozos blandos", category: "Desayunos", tags: T("Fruta/Otras") },
  { id: "des-huevo", name: "Huevo revuelto", emoji: "🥚", babySafety: "safe", babyNote: "Bien cocido, sin sal", category: "Desayunos", tags: T("Proteína/Huevo") },
  { id: "des-pan-tomate", name: "Pan con tomate", emoji: "🍅", babySafety: "caution", babyNote: "Pan con gluten, sin sal", category: "Desayunos", tags: T("Carbohidratos/Pan", "Verdura/Solanáceas") },
  { id: "des-pancakes-platano", name: "Tortitas de plátano", emoji: "🍌", babySafety: "safe", babyNote: "Solo plátano y huevo", category: "Desayunos", tags: T("Fruta/Otras", "Proteína/Huevo") },

  // ── Meriendas ──
  { id: "mer-fruta", name: "Fruta", emoji: "🍎", babySafety: "safe", babyNote: "En trozos blandos", category: "Meriendas", tags: T("Fruta/Otras") },
  { id: "mer-yogur", name: "Yogur", emoji: "🥛", babySafety: "safe", babyNote: "Natural sin azúcar", category: "Meriendas", tags: T("Lácteo/Yogur") },
  { id: "mer-queso", name: "Queso con pan", emoji: "🧀", babySafety: "caution", babyNote: "Queso suave, pan con gluten", category: "Meriendas", tags: T("Lácteo/Queso", "Carbohidratos/Pan") },
  { id: "mer-galletas-avena", name: "Galletas de avena", emoji: "🍪", babySafety: "safe", babyNote: "Caseras sin azúcar", category: "Meriendas", tags: T("Carbohidratos/Cereales") },
  { id: "mer-batido", name: "Batido de fruta", emoji: "🥤", babySafety: "safe", babyNote: "Fruta y leche, sin azúcar", category: "Meriendas", tags: T("Fruta/Otras", "Lácteo/Leche") },
  { id: "mer-platano", name: "Plátano", emoji: "🍌", babySafety: "safe", babyNote: "Maduro y blando", category: "Meriendas", tags: T("Fruta/Otras") },
  { id: "mer-hummus", name: "Hummus con palitos", emoji: "🥕", babySafety: "caution", babyNote: "Verduras blandas, hummus suave", category: "Meriendas", tags: T("Carbohidratos/Legumbres", "Verdura/Otras") },
  { id: "mer-tostada-queso", name: "Tostada con queso", emoji: "🧀", babySafety: "caution", babyNote: "Pan con gluten, queso suave", category: "Meriendas", tags: T("Carbohidratos/Pan", "Lácteo/Queso") },
];

export const MEAL_CATEGORIES = ["Pastas", "Carnes", "Vegetariano", "Arroces", "Sopas", "Especiales"];

export const BREAKFASTS = MEALS.filter((m) => m.category === "Desayunos");
export const SNACKS = MEALS.filter((m) => m.category === "Meriendas");

export const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export const SUNDAY_DINNER: Meal = {
  id: "pasta-domingo",
  name: "Pasta",
  emoji: "🍝",
  babySafety: "safe",
  babyNote: "Clásico familiar, apto bebé sin sal",
  category: "Pastas",
  tags: ["Carbohidratos/Pasta"],
};

export const DELIVERY_DINNER: Meal = {
  id: "delivery",
  name: "Delivery 🛵",
  emoji: "🛵",
  babySafety: "caution",
  babyNote: "Comida de pedido, adaptar para bebé",
  category: "Especiales",
  tags: ["Otros/Especial"],
};

export const TAKEAWAY_DINNER: Meal = {
  id: "takeaway",
  name: "Takeaway 🥡",
  emoji: "🥡",
  babySafety: "caution",
  babyNote: "Comida para llevar, adaptar para bebé",
  category: "Especiales",
  tags: ["Otros/Especial"],
};

export const RESTAURANT_DINNER: Meal = {
  id: "restaurante",
  name: "Restaurante 🍽️",
  emoji: "🍽️",
  babySafety: "caution",
  babyNote: "Comemos afuera, adaptar para bebé",
  category: "Especiales",
  tags: ["Otros/Especial"],
};

export const DELIVERY_LEFTOVERS: Meal = {
  id: "delivery-sobras",
  name: "Sobras del delivery",
  emoji: "📦",
  babySafety: "caution",
  babyNote: "Adaptar según lo que sobró",
  category: "Especiales",
  tags: ["Otros/Especial"],
};

export const TAKEAWAY_LEFTOVERS: Meal = {
  id: "takeaway-sobras",
  name: "Sobras del takeaway",
  emoji: "📦",
  babySafety: "caution",
  babyNote: "Adaptar según lo que sobró",
  category: "Especiales",
  tags: ["Otros/Especial"],
};
