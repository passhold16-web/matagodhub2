import { useEffect, useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import {
  NATURES,
  NATURE_ES,
  ITEMS,
  ITEM_ES,
  STAT_KEYS,
  STAT_LABELS_SHORT,
  MAX_EV_TOTAL,
  MAX_EV_STAT,
  MAX_IV,
  fetchPokemonMoves,
  fetchPokemonAbilities,
  type TeamMember,
  type StatKey,
} from "@/data/pokemonMeta";
import { Search } from "lucide-react";

interface Props {
  member: TeamMember;
  onChange: (next: TeamMember) => void;
}

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, isNaN(n) ? 0 : n));

export const PokemonDetailEditor = ({ member, onChange }: Props) => {
  const [moveOptions, setMoveOptions] = useState<string[]>([]);
  const [abilityOptions, setAbilityOptions] = useState<string[]>([]);
  const [moveSearch, setMoveSearch] = useState<string[]>(["", "", "", ""]);
  const [itemSearch, setItemSearch] = useState(
    member.item ? ITEM_ES[member.item] ?? member.item : ""
  );

  useEffect(() => {
    fetchPokemonMoves(member.pokemonId).then(setMoveOptions);
    fetchPokemonAbilities(member.pokemonId).then((abilities) => {
      setAbilityOptions(abilities);
      // Auto-pick first ability if none set
      if (!member.ability && abilities.length > 0) {
        onChange({ ...member, ability: abilities[0] });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member.pokemonId]);

  useEffect(() => {
    // Sync external changes (e.g., when editing an existing build)
    setItemSearch(member.item ? ITEM_ES[member.item] ?? member.item : "");
  }, [member.item]);

  const evTotal = useMemo(
    () => STAT_KEYS.reduce((s, k) => s + (member.evs[k] || 0), 0),
    [member.evs]
  );

  const setMove = (i: number, v: string) => {
    const moves = [...member.moves] as TeamMember["moves"];
    moves[i] = v;
    onChange({ ...member, moves });
  };

  const setEV = (k: StatKey, v: number) => {
    const next = clamp(v, 0, MAX_EV_STAT);
    const others = STAT_KEYS.reduce(
      (s, key) => (key === k ? s : s + (member.evs[key] || 0)),
      0
    );
    const allowed = Math.max(0, MAX_EV_TOTAL - others);
    onChange({ ...member, evs: { ...member.evs, [k]: Math.min(next, allowed) } });
  };

  const setIV = (k: StatKey, v: number) => {
    onChange({ ...member, ivs: { ...member.ivs, [k]: clamp(v, 0, MAX_IV) } });
  };

  // Item search supports searching by both English key and Spanish label.
  const [itemFocused, setItemFocused] = useState(false);
  const itemMatches = useMemo(() => {
    const q = itemSearch.toLowerCase().trim();
    if (!itemFocused) return [];
    const filtered = ITEMS.filter((i) => {
      if (q.length === 0) return true;
      const es = (ITEM_ES[i] ?? "").toLowerCase();
      return i.toLowerCase().includes(q) || es.includes(q);
    });
    return filtered.slice(0, 12);
  }, [itemSearch, itemFocused]);

  const moveMatches = (i: number) => {
    const q = moveSearch[i].toLowerCase();
    if (q.length < 2) return [];
    return moveOptions.filter((m) => m.toLowerCase().includes(q)).slice(0, 6);
  };

  return (
    <div className="space-y-4 bg-background/40 rounded-md p-3 border border-primary/10">
      {/* Item + Nature */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <label className="font-display text-[10px] tracking-widest text-foreground/60 mb-1 block">
            OBJETO
          </label>
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-foreground/40" />
            <Input
              value={itemSearch}
              onChange={(e) => setItemSearch(e.target.value)}
              onFocus={() => setItemFocused(true)}
              onBlur={() => {
                // Delay so click on dropdown still fires
                setTimeout(() => setItemFocused(false), 150);
                const q = itemSearch.trim();
                if (q === "") {
                  onChange({ ...member, item: "" });
                  return;
                }
                const match = ITEMS.find(
                  (i) =>
                    i.toLowerCase() === q.toLowerCase() ||
                    (ITEM_ES[i] ?? "").toLowerCase() === q.toLowerCase()
                );
                if (match) {
                  setItemSearch(ITEM_ES[match] ?? match);
                  onChange({ ...member, item: match });
                } else {
                  // Restore previous valid item label if user typed garbage
                  setItemSearch(member.item ? ITEM_ES[member.item] ?? member.item : "");
                }
              }}
              placeholder="Toca para elegir objeto..."
              className="pl-7 h-9 text-sm bg-background/60 border-primary/30"
            />
          </div>
          {itemMatches.length > 0 && (
            <div className="absolute z-30 left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-md border border-primary/30 bg-card/95 backdrop-blur-xl shadow-lg">
              {itemMatches.map((it) => (
                <button
                  key={it}
                  type="button"
                  onMouseDown={(e) => {
                    // mousedown fires before blur — prevents the blur reset
                    e.preventDefault();
                    setItemSearch(ITEM_ES[it] ?? it);
                    onChange({ ...member, item: it });
                    setItemFocused(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-primary/10 text-foreground/90"
                >
                  {ITEM_ES[it] ?? it}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="font-display text-[10px] tracking-widest text-foreground/60 mb-1 block">
            NATURALEZA
          </label>
          <select
            value={member.nature}
            onChange={(e) => onChange({ ...member, nature: e.target.value as TeamMember["nature"] })}
            className="w-full h-9 rounded-md bg-background/60 border border-primary/30 px-2 text-sm text-foreground focus:border-primary focus:outline-none"
          >
            {NATURES.map((n) => (
              <option key={n} value={n} className="bg-card">
                {NATURE_ES[n]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Ability */}
      <div>
        <label className="font-display text-[10px] tracking-widest text-foreground/60 mb-1 block">
          HABILIDAD
        </label>
        {abilityOptions.length > 0 ? (
          <select
            value={member.ability}
            onChange={(e) => onChange({ ...member, ability: e.target.value })}
            className="w-full h-9 rounded-md bg-background/60 border border-primary/30 px-2 text-sm text-foreground focus:border-primary focus:outline-none"
          >
            {abilityOptions.map((a) => (
              <option key={a} value={a} className="bg-card">
                {a}
              </option>
            ))}
          </select>
        ) : (
          <div className="h-9 rounded-md bg-background/60 border border-primary/30 px-2 text-xs text-foreground/40 flex items-center">
            Cargando habilidades...
          </div>
        )}
      </div>

      {/* Moves */}
      <div>
        <label className="font-display text-[10px] tracking-widest text-foreground/60 mb-1 block">
          MOVIMIENTOS
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[0, 1, 2, 3].map((i) => {
            const matches = moveMatches(i);
            return (
              <div key={i} className="relative">
                <Input
                  value={moveSearch[i] || member.moves[i]}
                  onChange={(e) => {
                    const ns = [...moveSearch];
                    ns[i] = e.target.value;
                    setMoveSearch(ns);
                    setMove(i, e.target.value);
                  }}
                  placeholder={`Movimiento ${i + 1}`}
                  className="h-9 text-sm bg-background/60 border-primary/30"
                />
                {matches.length > 0 && (
                  <div className="absolute z-20 left-0 right-0 mt-1 max-h-36 overflow-y-auto rounded-md border border-primary/30 bg-card/95 backdrop-blur-xl shadow-lg">
                    {matches.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          setMove(i, m);
                          const ns = [...moveSearch];
                          ns[i] = "";
                          setMoveSearch(ns);
                        }}
                        className="w-full text-left px-2.5 py-1 text-xs capitalize hover:bg-primary/10 text-foreground/90"
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* EVs */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="font-display text-[10px] tracking-widest text-foreground/60">
            EVs
          </label>
          <span
            className={`font-display text-[10px] tracking-wider ${
              evTotal > MAX_EV_TOTAL
                ? "text-destructive"
                : evTotal === MAX_EV_TOTAL
                ? "text-accent"
                : "text-foreground/50"
            }`}
          >
            {evTotal}/{MAX_EV_TOTAL}
          </span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {STAT_KEYS.map((k) => (
            <div key={k}>
              <div className="font-display text-[9px] tracking-wider text-foreground/50 mb-0.5 text-center">
                {STAT_LABELS_SHORT[k]}
              </div>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                max={MAX_EV_STAT}
                value={member.evs[k]}
                onChange={(e) => setEV(k, parseInt(e.target.value, 10))}
                className="h-9 text-sm text-center px-1 bg-background/60 border-primary/30"
              />
            </div>
          ))}
        </div>
      </div>

      {/* IVs */}
      <div>
        <label className="font-display text-[10px] tracking-widest text-foreground/60 mb-1 block">
          IVs (0-31)
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {STAT_KEYS.map((k) => (
            <div key={k}>
              <div className="font-display text-[9px] tracking-wider text-foreground/50 mb-0.5 text-center">
                {STAT_LABELS_SHORT[k]}
              </div>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                max={MAX_IV}
                value={member.ivs[k]}
                onChange={(e) => setIV(k, parseInt(e.target.value, 10))}
                className="h-9 text-sm text-center px-1 bg-background/60 border-primary/30"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
