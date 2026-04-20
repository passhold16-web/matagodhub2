import { LEGENDARY_IDS } from "@/data/mockBuilds";
import { PokemonSprite } from "./PokemonSprite";

export const LegendaryMarquee = () => {
  // Duplicate the array so the marquee loop is seamless
  const items = [...LEGENDARY_IDS, ...LEGENDARY_IDS];

  return (
    <section className="relative py-8 border-y border-primary/20 glass overflow-hidden">
      <div className="absolute top-2 left-1/2 -translate-x-1/2 font-display text-[10px] tracking-[0.4em] text-accent">
        ◆  GEN V LEGENDARY ROSTER  ◆
      </div>
      <div className="marquee mt-4">
        <div className="marquee-track">
          {items.map((id, i) => (
            <div key={`${id}-${i}`} className="flex items-center gap-3 shrink-0">
              <PokemonSprite id={id} size={72} />
              <span className="font-display text-xs text-muted-foreground tracking-widest">
                #{String(id).padStart(3, "0")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
