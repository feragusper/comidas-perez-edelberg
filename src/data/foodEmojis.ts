// Comprehensive list of food & drink emojis with searchable keywords (Spanish)
export interface FoodEmoji {
  emoji: string;
  keywords: string[]; // lowercased Spanish keywords for search
}

const RAW: FoodEmoji[] = [
  // Platos preparados
  { emoji: "🍽️", keywords: ["plato", "comida", "cubierto", "cena"] },
  { emoji: "🥣", keywords: ["bowl", "tazon", "sopa", "cereal", "ensalada"] },
  { emoji: "🍲", keywords: ["olla", "guiso", "estofado", "sopa", "caldo"] },
  { emoji: "🍛", keywords: ["curry", "arroz", "guiso"] },
  { emoji: "🍜", keywords: ["ramen", "fideos", "sopa", "noodles"] },
  { emoji: "🍝", keywords: ["pasta", "spaghetti", "fideos", "tallarines", "espagueti"] },
  { emoji: "🍣", keywords: ["sushi", "japones", "pescado"] },
  { emoji: "🍤", keywords: ["camaron", "langostino", "tempura", "gamba"] },
  { emoji: "🍱", keywords: ["bento", "japones", "vianda"] },
  { emoji: "🥟", keywords: ["empanada", "dumpling", "gyoza"] },
  { emoji: "🍚", keywords: ["arroz", "blanco"] },
  { emoji: "🍙", keywords: ["onigiri", "arroz", "japones"] },
  { emoji: "🍘", keywords: ["galleta", "arroz", "senbei"] },
  { emoji: "🍢", keywords: ["brocheta", "japones", "oden"] },
  { emoji: "🍡", keywords: ["dango", "dulce", "japones"] },
  { emoji: "🥧", keywords: ["pie", "tarta", "torta"] },
  { emoji: "🧁", keywords: ["cupcake", "muffin", "magdalena", "dulce"] },
  { emoji: "🍰", keywords: ["torta", "pastel", "cake", "dulce"] },
  { emoji: "🎂", keywords: ["torta", "cumpleaños", "cake", "dulce"] },
  { emoji: "🍮", keywords: ["flan", "pudding", "dulce", "postre"] },
  { emoji: "🍭", keywords: ["chupetin", "lollipop", "dulce", "caramelo"] },
  { emoji: "🍬", keywords: ["caramelo", "dulce", "golosina"] },
  { emoji: "🍫", keywords: ["chocolate", "barra", "dulce"] },
  { emoji: "🍿", keywords: ["pochoclo", "popcorn", "palomitas"] },
  { emoji: "🍩", keywords: ["donut", "dona", "rosquilla", "dulce"] },
  { emoji: "🍪", keywords: ["galleta", "cookie", "dulce"] },
  { emoji: "🥠", keywords: ["galleta", "fortuna", "chino"] },
  { emoji: "🥡", keywords: ["takeaway", "delivery", "comida", "para llevar"] },
  { emoji: "🫕", keywords: ["fondue", "queso", "chocolate"] },
  { emoji: "🥘", keywords: ["paella", "guiso", "sarten", "cazuela"] },
  { emoji: "🥗", keywords: ["ensalada", "verdura", "lechuga", "verde"] },
  { emoji: "🥙", keywords: ["pita", "kebab", "shawarma", "wrap"] },
  { emoji: "🌯", keywords: ["burrito", "wrap", "mexicano"] },
  { emoji: "🌮", keywords: ["taco", "mexicano"] },
  { emoji: "🫔", keywords: ["tamal", "mexicano"] },
  { emoji: "🥪", keywords: ["sandwich", "sanguche", "pan"] },
  { emoji: "🍔", keywords: ["hamburguesa", "burger"] },
  { emoji: "🌭", keywords: ["pancho", "hot dog", "salchicha"] },
  { emoji: "🍟", keywords: ["papas", "fritas", "french fries"] },
  { emoji: "🍕", keywords: ["pizza", "muzzarella"] },
  { emoji: "🫓", keywords: ["pan", "plano", "pita", "naan"] },
  { emoji: "🧆", keywords: ["falafel", "albondiga", "garbanzo"] },
  { emoji: "🥨", keywords: ["pretzel", "rosca"] },
  { emoji: "🥯", keywords: ["bagel", "pan"] },
  { emoji: "🍳", keywords: ["huevo", "frito", "desayuno"] },
  { emoji: "🧇", keywords: ["waffle", "wafle", "desayuno"] },
  { emoji: "🥞", keywords: ["panqueque", "pancake", "tortita"] },
  // Carnes y proteínas
  { emoji: "🍗", keywords: ["pollo", "pata", "muslo", "ave"] },
  { emoji: "🍖", keywords: ["carne", "hueso", "costilla", "asado"] },
  { emoji: "🥩", keywords: ["bife", "carne", "vaca", "steak", "filete"] },
  { emoji: "🥓", keywords: ["panceta", "bacon", "tocino"] },
  { emoji: "🥚", keywords: ["huevo"] },
  { emoji: "🦞", keywords: ["langosta", "marisco"] },
  { emoji: "🦀", keywords: ["cangrejo", "marisco"] },
  { emoji: "🦐", keywords: ["camaron", "langostino", "gamba", "marisco"] },
  { emoji: "🦑", keywords: ["calamar", "marisco"] },
  { emoji: "🐟", keywords: ["pescado", "pez"] },
  { emoji: "🐠", keywords: ["pescado", "pez", "tropical"] },
  { emoji: "🐡", keywords: ["pescado", "pez", "globo"] },
  { emoji: "🦪", keywords: ["ostra", "marisco"] },
  // Vegetales
  { emoji: "🥦", keywords: ["brocoli", "verdura", "verde"] },
  { emoji: "🥬", keywords: ["lechuga", "acelga", "espinaca", "verdura", "verde", "hoja"] },
  { emoji: "🥒", keywords: ["pepino", "verdura"] },
  { emoji: "🌶️", keywords: ["aji", "picante", "chile"] },
  { emoji: "🫑", keywords: ["morron", "pimiento", "verdura"] },
  { emoji: "🌽", keywords: ["choclo", "maiz", "elote"] },
  { emoji: "🥕", keywords: ["zanahoria", "verdura"] },
  { emoji: "🧄", keywords: ["ajo"] },
  { emoji: "🧅", keywords: ["cebolla"] },
  { emoji: "🥔", keywords: ["papa", "patata", "tuberculo"] },
  { emoji: "🍠", keywords: ["batata", "boniato", "camote", "tuberculo"] },
  { emoji: "🥜", keywords: ["mani", "cacahuate", "nuez"] },
  { emoji: "🫘", keywords: ["poroto", "frijol", "judia", "legumbre"] },
  { emoji: "🌰", keywords: ["castaña", "nuez"] },
  { emoji: "🍄", keywords: ["hongo", "champignon", "seta"] },
  { emoji: "🍅", keywords: ["tomate", "verdura"] },
  { emoji: "🥑", keywords: ["palta", "aguacate"] },
  { emoji: "🫛", keywords: ["arveja", "guisante", "chaucha"] },
  { emoji: "🫒", keywords: ["aceituna", "oliva"] },
  // Frutas
  { emoji: "🍇", keywords: ["uva", "fruta"] },
  { emoji: "🍈", keywords: ["melon", "fruta"] },
  { emoji: "🍉", keywords: ["sandia", "fruta"] },
  { emoji: "🍊", keywords: ["naranja", "mandarina", "fruta", "citrico"] },
  { emoji: "🍋", keywords: ["limon", "fruta", "citrico"] },
  { emoji: "🍌", keywords: ["banana", "platano", "fruta"] },
  { emoji: "🍍", keywords: ["ananá", "piña", "fruta"] },
  { emoji: "🥭", keywords: ["mango", "fruta"] },
  { emoji: "🍎", keywords: ["manzana", "roja", "fruta"] },
  { emoji: "🍏", keywords: ["manzana", "verde", "fruta"] },
  { emoji: "🍐", keywords: ["pera", "fruta"] },
  { emoji: "🍑", keywords: ["durazno", "melocoton", "fruta"] },
  { emoji: "🍒", keywords: ["cereza", "guinda", "fruta"] },
  { emoji: "🍓", keywords: ["frutilla", "fresa", "fruta"] },
  { emoji: "🫐", keywords: ["arandano", "blueberry", "fruta"] },
  { emoji: "🥝", keywords: ["kiwi", "fruta"] },
  { emoji: "🥥", keywords: ["coco", "fruta"] },
  // Panes y cereales
  { emoji: "🍞", keywords: ["pan", "lactal"] },
  { emoji: "🥖", keywords: ["pan", "baguette", "frances"] },
  { emoji: "🥐", keywords: ["medialuna", "croissant", "factura"] },
  { emoji: "🌾", keywords: ["trigo", "cereal", "espiga"] },
  // Lácteos
  { emoji: "🥛", keywords: ["leche", "lacteo", "vaso"] },
  { emoji: "🧀", keywords: ["queso", "lacteo"] },
  { emoji: "🧈", keywords: ["manteca", "mantequilla", "lacteo"] },
  { emoji: "🍦", keywords: ["helado", "cucurucho", "dulce"] },
  { emoji: "🍧", keywords: ["granizado", "raspado", "hielo"] },
  { emoji: "🍨", keywords: ["helado", "copa", "dulce"] },
  // Bebidas
  { emoji: "☕", keywords: ["cafe", "te", "caliente", "bebida"] },
  { emoji: "🫖", keywords: ["tetera", "te", "bebida"] },
  { emoji: "🍵", keywords: ["te", "matcha", "bebida"] },
  { emoji: "🧃", keywords: ["jugo", "zumo", "caja", "bebida"] },
  { emoji: "🥤", keywords: ["gaseosa", "soda", "vaso", "bebida"] },
  { emoji: "🧋", keywords: ["bubble tea", "te", "bebida"] },
  { emoji: "🍶", keywords: ["sake", "japones", "bebida"] },
  { emoji: "🍺", keywords: ["cerveza", "birra", "bebida"] },
  { emoji: "🍻", keywords: ["cerveza", "brindis", "bebida"] },
  { emoji: "🥂", keywords: ["champagne", "brindis", "bebida"] },
  { emoji: "🍷", keywords: ["vino", "copa", "bebida"] },
  { emoji: "🥃", keywords: ["whisky", "trago", "bebida"] },
  { emoji: "🍸", keywords: ["coctel", "martini", "trago", "bebida"] },
  { emoji: "🍹", keywords: ["coctel", "tropical", "trago", "bebida"] },
  { emoji: "🍾", keywords: ["champagne", "botella", "bebida"] },
  { emoji: "🧉", keywords: ["mate", "yerba", "bebida"] },
  { emoji: "🧊", keywords: ["hielo", "cubo"] },
  // Dulces extras
  { emoji: "🍯", keywords: ["miel", "dulce"] },
  // Utensilios y otros
  { emoji: "🍴", keywords: ["cubierto", "tenedor", "cuchillo"] },
  { emoji: "🥄", keywords: ["cuchara"] },
  { emoji: "🔪", keywords: ["cuchillo"] },
  { emoji: "🫙", keywords: ["frasco", "tarro"] },
  { emoji: "🧂", keywords: ["sal", "salero", "condimento"] },
  { emoji: "🥫", keywords: ["lata", "conserva"] },
];

// Dedup by emoji
const seen = new Set<string>();
export const FOOD_EMOJIS_DATA: FoodEmoji[] = RAW.filter((f) => {
  if (seen.has(f.emoji)) return false;
  seen.add(f.emoji);
  return true;
});

export const FOOD_EMOJIS: string[] = FOOD_EMOJIS_DATA.map((f) => f.emoji);

const normalize = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export function searchEmojis(query: string): FoodEmoji[] {
  const q = normalize(query.trim());
  if (!q) return FOOD_EMOJIS_DATA;
  return FOOD_EMOJIS_DATA.filter((f) =>
    f.keywords.some((k) => normalize(k).includes(q))
  );
}
