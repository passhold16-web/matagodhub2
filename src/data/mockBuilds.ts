// Mock builds for MATAGOD HUB preview phase.
// Pokémon IDs (PokeAPI national dex) — used to fetch Gen 5 animated sprites.

export type Tier = "OU" | "UU" | "NU" | "VGC";

export interface Build {
  id: string;
  name: string;
  author: string;
  tier: Tier;
  description: string;
  pokemonIds: number[]; // 6 IDs
  votes: number;
  views: number;
}

export const TIERS: Tier[] = ["OU", "UU", "NU", "VGC"];

export const MOCK_BUILDS: Build[] = [
  {
    id: "1",
    name: "Hyper Offense Reign",
    author: "ShadowKing",
    tier: "OU",
    description: "Equipo de presión brutal con sweepers de élite. Domina el midgame.",
    pokemonIds: [445, 248, 376, 130, 145, 149], // Garchomp, Tyranitar, Metagross, Gyarados, Zapdos, Dragonite
    votes: 1247,
    views: 8932,
  },
  {
    id: "2",
    name: "Stall Eternal",
    author: "WallMaster",
    tier: "OU",
    description: "Defensa absoluta. Hazards + recovery = victoria garantizada.",
    pokemonIds: [242, 143, 121, 230, 211, 73],
    votes: 982,
    views: 6210,
  },
  {
    id: "3",
    name: "Sand Storm Veteran",
    author: "DesertWolf",
    tier: "UU",
    description: "Equipo de arena con abusadores de Sand Rush y Sand Force.",
    pokemonIds: [232, 31, 95, 105, 308, 219],
    votes: 654,
    views: 4521,
  },
  {
    id: "4",
    name: "Rain Dance Tsunami",
    author: "AquaLord",
    tier: "UU",
    description: "Lluvia perpetua + Swift Swim sweepers. Ahoga a tus rivales.",
    pokemonIds: [186, 91, 195, 419, 130, 134],
    votes: 723,
    views: 5103,
  },
  {
    id: "5",
    name: "Trick Room Doom",
    author: "SlowMotion",
    tier: "NU",
    description: "Reverse speed con monstruos lentos pero brutales.",
    pokemonIds: [80, 76, 208, 199, 217, 9],
    votes: 412,
    views: 3014,
  },
  {
    id: "6",
    name: "Volt-Turn Pivot",
    author: "PivotPro",
    tier: "NU",
    description: "Momentum constante con U-turn y Volt Switch.",
    pokemonIds: [125, 169, 309, 21, 162, 101],
    votes: 387,
    views: 2891,
  },
  {
    id: "7",
    name: "Little Cup Tyrants",
    author: "TinyTitan",
    tier: "LC",
    description: "Los más pequeños, los más letales. LC meta-defining squad.",
    pokemonIds: [172, 175, 298, 360, 280, 374],
    votes: 521,
    views: 3672,
  },
  {
    id: "8",
    name: "Baby Boom Squad",
    author: "Cradlerock",
    tier: "LC",
    description: "Setup con Eviolite y prioridad. Domina LC sin esfuerzo.",
    pokemonIds: [438, 439, 440, 446, 447, 458],
    votes: 298,
    views: 2143,
  },
  {
    id: "9",
    name: "Bulky Offense Apex",
    author: "Equilibrium",
    tier: "OU",
    description: "Balance perfecto entre defensa y poder ofensivo.",
    pokemonIds: [248, 350, 386, 376, 472, 145],
    votes: 891,
    views: 5891,
  },
];

// Build PokeAPI Gen 5 animated sprite URL.
// PokeAPI hosts Black-White animated GIFs at:
// https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/{id}.gif
export const spriteUrl = (id: number) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${id}.gif`;

// Static fallback (Gen 5 BW front)
export const spriteFallback = (id: number) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/${id}.png`;

// Legendary IDs for marquee (Gen 5 legendaries)
export const LEGENDARY_IDS = [638, 639, 640, 641, 642, 643, 644, 645, 646, 647, 648, 649];
