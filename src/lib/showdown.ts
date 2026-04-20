import {
  type TeamMember,
  STAT_KEYS,
  STAT_LABELS_SHORT,
} from "@/data/pokemonMeta";

const SHOWDOWN_STAT: Record<(typeof STAT_KEYS)[number], string> = {
  hp: "HP",
  atk: "Atk",
  def: "Def",
  spa: "SpA",
  spd: "SpD",
  spe: "Spe",
};

const cap = (s: string) =>
  s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

/**
 * Convert a team to Pokémon Showdown format (English, the standard).
 * https://pokepast.es / https://play.pokemonshowdown.com
 */
export function teamToShowdown(team: TeamMember[]): string {
  return team
    .map((m) => {
      const lines: string[] = [];
      const name = cap(m.pokemonName || `pokemon-${m.pokemonId}`);
      lines.push(m.item ? `${name} @ ${m.item}` : name);
      if (m.ability) lines.push(`Ability: ${m.ability}`);

      const evs = STAT_KEYS.filter((k) => (m.evs?.[k] ?? 0) > 0).map(
        (k) => `${m.evs[k]} ${SHOWDOWN_STAT[k]}`
      );
      if (evs.length > 0) lines.push(`EVs: ${evs.join(" / ")}`);

      if (m.nature) lines.push(`${m.nature} Nature`);

      const ivs = STAT_KEYS.filter((k) => (m.ivs?.[k] ?? 31) !== 31).map(
        (k) => `${m.ivs[k]} ${SHOWDOWN_STAT[k]}`
      );
      if (ivs.length > 0) lines.push(`IVs: ${ivs.join(" / ")}`);

      m.moves.filter(Boolean).forEach((mv) => lines.push(`- ${cap(mv)}`));
      return lines.join("\n");
    })
    .join("\n\n");
}

// Expose label map for any consumers that want it
export { STAT_LABELS_SHORT };
