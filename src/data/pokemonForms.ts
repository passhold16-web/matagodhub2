// Curated alternate forms / variants from PokeAPI (Gen 1-5 PokeMMO scope).
// Each entry uses PokeAPI's "pokemon" endpoint name and its numeric id (>10000 for forms).
// Sprites are served from the standard PokeAPI sprites repo by id.

export interface PokemonForm {
  id: number;          // PokeAPI numeric id (used for sprite URL)
  name: string;        // PokeAPI slug (also the saved canonical name)
  display: string;     // Human-friendly label, ES-friendly
  baseId: number;      // Base species dex id (used for matching searches)
}

export const POKEMON_FORMS: PokemonForm[] = [
  // Rotom alternate forms
  { id: 10008, name: "rotom-heat",   display: "Rotom Calor (Horno)",       baseId: 479 },
  { id: 10009, name: "rotom-wash",   display: "Rotom Lavado (Lavadora)",   baseId: 479 },
  { id: 10010, name: "rotom-frost",  display: "Rotom Frío (Nevera)",       baseId: 479 },
  { id: 10011, name: "rotom-fan",    display: "Rotom Ventilador",          baseId: 479 },
  { id: 10012, name: "rotom-mow",    display: "Rotom Corte (Césped)",      baseId: 479 },

  // Deoxys forms
  { id: 10001, name: "deoxys-attack", display: "Deoxys Ataque",  baseId: 386 },
  { id: 10002, name: "deoxys-defense", display: "Deoxys Defensa", baseId: 386 },
  { id: 10003, name: "deoxys-speed",  display: "Deoxys Velocidad", baseId: 386 },

  // Wormadam alternate cloaks
  { id: 10004, name: "wormadam-sandy", display: "Wormadam Arenoso", baseId: 413 },
  { id: 10005, name: "wormadam-trash", display: "Wormadam Basura",  baseId: 413 },

  // Giratina
  { id: 10007, name: "giratina-origin", display: "Giratina Origen", baseId: 487 },

  // Shaymin
  { id: 10006, name: "shaymin-sky", display: "Shaymin Cielo", baseId: 492 },

  // Therian forms (Gen 5)
  { id: 10018, name: "tornadus-therian", display: "Tornadus Tótem",  baseId: 641 },
  { id: 10019, name: "thundurus-therian", display: "Thundurus Tótem", baseId: 642 },
  { id: 10020, name: "landorus-therian", display: "Landorus Tótem",  baseId: 645 },

  // Kyurem
  { id: 10022, name: "kyurem-black", display: "Kyurem Negro", baseId: 646 },
  { id: 10021, name: "kyurem-white", display: "Kyurem Blanco", baseId: 646 },

  // Keldeo / Meloetta
  { id: 10024, name: "keldeo-resolute", display: "Keldeo Resolución", baseId: 647 },
  { id: 10017, name: "meloetta-pirouette", display: "Meloetta Danza", baseId: 648 },

  // Castform
  { id: 10013, name: "castform-sunny", display: "Castform Sol",    baseId: 351 },
  { id: 10014, name: "castform-rainy", display: "Castform Lluvia", baseId: 351 },
  { id: 10015, name: "castform-snowy", display: "Castform Nieve",  baseId: 351 },

  // Darmanitan
  { id: 10016, name: "darmanitan-zen", display: "Darmanitan Daruma", baseId: 555 },
];

export const FORM_BY_ID = new Map(POKEMON_FORMS.map((f) => [f.id, f]));
