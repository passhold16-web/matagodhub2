// Static reference data for the technical build editor.
// All user-facing labels are in Spanish.

export const NATURES = [
  "Hardy", "Lonely", "Brave", "Adamant", "Naughty",
  "Bold", "Docile", "Relaxed", "Impish", "Lax",
  "Timid", "Hasty", "Serious", "Jolly", "Naive",
  "Modest", "Mild", "Quiet", "Bashful", "Rash",
  "Calm", "Gentle", "Sassy", "Careful", "Quirky",
] as const;

export type Nature = (typeof NATURES)[number];

// English -> Spanish nature names (Bulbapedia / Pokémon ES)
export const NATURE_ES: Record<Nature, string> = {
  Hardy: "Fuerte",
  Lonely: "Huraña",
  Brave: "Audaz",
  Adamant: "Firme",
  Naughty: "Pícara",
  Bold: "Osada",
  Docile: "Dócil",
  Relaxed: "Plácida",
  Impish: "Agitada",
  Lax: "Floja",
  Timid: "Miedosa",
  Hasty: "Activa",
  Serious: "Seria",
  Jolly: "Alegre",
  Naive: "Ingenua",
  Modest: "Modesta",
  Mild: "Afable",
  Quiet: "Mansa",
  Bashful: "Tímida",
  Rash: "Alocada",
  Calm: "Serena",
  Gentle: "Amable",
  Sassy: "Grosera",
  Careful: "Cauta",
  Quirky: "Rara",
};

export const natureLabel = (n: string) =>
  (NATURE_ES as Record<string, string>)[n] ?? n;

// Common competitive items (PokeMMO-relevant, Gen 1-5).
export const ITEMS = [
  "Choice Band", "Choice Scarf", "Choice Specs",
  "Life Orb", "Leftovers", "Focus Sash", "Eviolite",
  "Air Balloon", "Black Sludge", "Assault Vest",
  "Rocky Helmet", "Expert Belt", "Wide Lens",
  "Lum Berry", "Sitrus Berry", "Chesto Berry",
  "Salac Berry", "Liechi Berry", "Petaya Berry",
  "Light Clay", "Heat Rock", "Damp Rock", "Smooth Rock", "Icy Rock",
  "Mental Herb", "Power Herb", "White Herb",
  "Toxic Orb", "Flame Orb", "Black Belt", "Charcoal",
  "Mystic Water", "Magnet", "Miracle Seed", "NeverMeltIce",
  "Poison Barb", "Soft Sand", "Sharp Beak", "Twisted Spoon",
  "Silver Powder", "Hard Stone", "Spell Tag", "Dragon Fang",
  "BlackGlasses", "Metal Coat", "Pixie Plate",
  "Shell Bell", "Quick Claw", "King's Rock", "Razor Claw",
  "Scope Lens", "Muscle Band", "Wise Glasses",
  "Loaded Dice",
] as const;

// English -> Spanish items (PokeMMO oficial / Bulbapedia ES).
export const ITEM_ES: Record<string, string> = {
  "Choice Band": "Cinta Elegida",
  "Choice Scarf": "Pañuelo Elegido",
  "Choice Specs": "Gafas Elegidas",
  "Life Orb": "Vidasfera",
  "Leftovers": "Restos",
  "Focus Sash": "Banda Focus",
  "Eviolite": "Mineral Evolutivo",
  "Air Balloon": "Globo Helio",
  "Black Sludge": "Lodo Negro",
  "Assault Vest": "Chaleco Asalto",
  "Rocky Helmet": "Casco Dentado",
  "Expert Belt": "Cinta Experto",
  "Wide Lens": "Lupa",
  "Lum Berry": "Baya Zreza",
  "Sitrus Berry": "Baya Zidra",
  "Chesto Berry": "Baya Atania",
  "Salac Berry": "Baya Aslac",
  "Liechi Berry": "Baya Lichi",
  "Petaya Berry": "Baya Yapati",
  "Light Clay": "Refleluz",
  "Heat Rock": "Roca Calor",
  "Damp Rock": "Roca Lluvia",
  "Smooth Rock": "Roca Suave",
  "Icy Rock": "Roca Helada",
  "Mental Herb": "Hierba Mental",
  "Power Herb": "Hierba Energía",
  "White Herb": "Hierba Blanca",
  "Toxic Orb": "Toxiesfera",
  "Flame Orb": "Llamasfera",
  "Black Belt": "Cinta Negra",
  "Charcoal": "Carbón",
  "Mystic Water": "Agua Mística",
  "Magnet": "Imán",
  "Miracle Seed": "Semilla Milagro",
  "NeverMeltIce": "Antiderretir",
  "Poison Barb": "Flecha Veneno",
  "Soft Sand": "Arena Fina",
  "Sharp Beak": "Pico Afilado",
  "Twisted Spoon": "Cuchara Torcida",
  "Silver Powder": "Polvo Plata",
  "Hard Stone": "Piedra Dura",
  "Spell Tag": "Hechizo",
  "Dragon Fang": "Colmillo Dragón",
  "BlackGlasses": "Gafas de Sol",
  "Metal Coat": "Revestim. Metálico",
  "Pixie Plate": "Tabla Duende",
  "Shell Bell": "Camp. Concha",
  "Quick Claw": "Garra Rápida",
  "King's Rock": "Roca del Rey",
  "Razor Claw": "Garra Afilada",
  "Scope Lens": "Periscopio",
  "Muscle Band": "Cinta Músculo",
  "Wise Glasses": "Gafas Especiales",
  "Loaded Dice": "Dados Trucados",
};

export const itemLabel = (i: string) => (i ? ITEM_ES[i] ?? i : "");

export const STAT_KEYS = ["hp", "atk", "def", "spa", "spd", "spe"] as const;
export type StatKey = (typeof STAT_KEYS)[number];

export const STAT_LABELS: Record<StatKey, string> = {
  hp: "PS",
  atk: "Ataque",
  def: "Defensa",
  spa: "At. Esp.",
  spd: "Def. Esp.",
  spe: "Velocidad",
};

export const STAT_LABELS_SHORT: Record<StatKey, string> = {
  hp: "PS",
  atk: "Atk",
  def: "Def",
  spa: "AtE",
  spd: "DfE",
  spe: "Vel",
};

export const MAX_EV_TOTAL = 510;
export const MAX_EV_STAT = 252;
export const MAX_IV = 31;

export interface TeamMember {
  pokemonId: number;
  pokemonName: string;
  item: string;
  ability: string;
  nature: Nature;
  moves: [string, string, string, string];
  evs: Record<StatKey, number>;
  ivs: Record<StatKey, number>;
}

export const emptyEVs = (): Record<StatKey, number> =>
  ({ hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 });

export const maxIVs = (): Record<StatKey, number> =>
  ({ hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 });

export const createMember = (id: number, name: string): TeamMember => ({
  pokemonId: id,
  pokemonName: name,
  item: "",
  ability: "",
  nature: "Hardy",
  moves: ["", "", "", ""],
  evs: emptyEVs(),
  ivs: maxIVs(),
});

// ---------- PokeAPI translation caches ----------

const moveCache = new Map<number, string[]>();
const moveTranslationCache = new Map<string, string>();
const abilityCache = new Map<number, string[]>();
const abilityTranslationCache = new Map<string, string>();

const slugify = (s: string) => s.toLowerCase().trim().replace(/\s+/g, "-");

// Translate a single move slug to Spanish (cached, with English fallback).
export async function translateMoveToEs(slug: string): Promise<string> {
  if (!slug) return slug;
  const key = slugify(slug);
  if (moveTranslationCache.has(key)) return moveTranslationCache.get(key)!;
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/move/${key}`);
    if (!res.ok) throw new Error("not found");
    const data = await res.json();
    const es = (data.names as { name: string; language: { name: string } }[]).find(
      (n) => n.language.name === "es"
    );
    const result = es?.name ?? slug.replace(/-/g, " ");
    moveTranslationCache.set(key, result);
    return result;
  } catch {
    const fallback = slug.replace(/-/g, " ");
    moveTranslationCache.set(key, fallback);
    return fallback;
  }
}

export async function fetchPokemonMoves(id: number): Promise<string[]> {
  if (moveCache.has(id)) return moveCache.get(id)!;
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    const data = await res.json();
    const slugs: string[] = (data.moves as { move: { name: string } }[]).map(
      (m) => m.move.name
    );
    const translated = await Promise.all(slugs.map((s) => translateMoveToEs(s)));
    const sorted = translated.sort((a, b) => a.localeCompare(b, "es"));
    moveCache.set(id, sorted);
    return sorted;
  } catch {
    return [];
  }
}

// ---------- Abilities ----------

export async function translateAbilityToEs(slug: string): Promise<string> {
  if (!slug) return slug;
  const key = slugify(slug);
  if (abilityTranslationCache.has(key)) return abilityTranslationCache.get(key)!;
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/ability/${key}`);
    if (!res.ok) throw new Error("not found");
    const data = await res.json();
    const es = (data.names as { name: string; language: { name: string } }[]).find(
      (n) => n.language.name === "es"
    );
    const result = es?.name ?? slug.replace(/-/g, " ");
    abilityTranslationCache.set(key, result);
    return result;
  } catch {
    const fallback = slug.replace(/-/g, " ");
    abilityTranslationCache.set(key, fallback);
    return fallback;
  }
}

export async function fetchPokemonAbilities(id: number): Promise<string[]> {
  if (abilityCache.has(id)) return abilityCache.get(id)!;
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    const data = await res.json();
    const slugs: string[] = (data.abilities as { ability: { name: string } }[]).map(
      (a) => a.ability.name
    );
    const translated = await Promise.all(slugs.map((s) => translateAbilityToEs(s)));
    abilityCache.set(id, translated);
    return translated;
  } catch {
    return [];
  }
}
