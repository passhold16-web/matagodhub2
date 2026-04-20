// Static reference data for the technical build editor.

export const NATURES = [
  "Hardy", "Lonely", "Brave", "Adamant", "Naughty",
  "Bold", "Docile", "Relaxed", "Impish", "Lax",
  "Timid", "Hasty", "Serious", "Jolly", "Naive",
  "Modest", "Mild", "Quiet", "Bashful", "Rash",
  "Calm", "Gentle", "Sassy", "Careful", "Quirky",
] as const;

export type Nature = (typeof NATURES)[number];

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
] as const;

export const STAT_KEYS = ["hp", "atk", "def", "spa", "spd", "spe"] as const;
export type StatKey = (typeof STAT_KEYS)[number];

export const STAT_LABELS: Record<StatKey, string> = {
  hp: "HP",
  atk: "Atk",
  def: "Def",
  spa: "SpA",
  spd: "SpD",
  spe: "Spe",
};

export const MAX_EV_TOTAL = 510;
export const MAX_EV_STAT = 252;
export const MAX_IV = 31;

export interface TeamMember {
  pokemonId: number;
  pokemonName: string;
  item: string;
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
  nature: "Hardy",
  moves: ["", "", "", ""],
  evs: emptyEVs(),
  ivs: maxIVs(),
});

// Move suggestions cache from PokeAPI (Spanish names when available).
const moveCache = new Map<number, string[]>();
const moveTranslationCache = new Map<string, string>();

// Translate a single move slug (e.g. "thunder-punch") to Spanish.
// Falls back to the prettified English slug if PokeAPI has no ES name.
export async function translateMoveToEs(slug: string): Promise<string> {
  if (!slug) return slug;
  const key = slug.toLowerCase().replace(/\s+/g, "-");
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
    // Translate in parallel (cached after first run).
    const translated = await Promise.all(slugs.map((s) => translateMoveToEs(s)));
    const sorted = translated.sort((a, b) => a.localeCompare(b, "es"));
    moveCache.set(id, sorted);
    return sorted;
  } catch {
    return [];
  }
}

