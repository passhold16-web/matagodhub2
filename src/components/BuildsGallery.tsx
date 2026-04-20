import { useMemo, useState } from "react";
import { MOCK_BUILDS, TIERS, type Tier } from "@/data/mockBuilds";
import { BuildCard } from "./BuildCard";

type Filter = "ALL" | Tier;

export const BuildsGallery = () => {
  const [filter, setFilter] = useState<Filter>("ALL");

  const filtered = useMemo(
    () => (filter === "ALL" ? MOCK_BUILDS : MOCK_BUILDS.filter((b) => b.tier === filter)),
    [filter]
  );

  const filters: Filter[] = ["ALL", ...TIERS];

  return (
    <section id="builds" className="py-20 md:py-28 relative">
      <div className="container">
        <div className="text-center mb-12">
          <p className="font-display text-xs tracking-[0.4em] text-accent mb-3">
            ◆ COMPETITIVE TEAMS ◆
          </p>
          <h2 className="font-display text-4xl md:text-6xl font-black mb-4">
            <span className="neon-text-red">BUILDS</span>{" "}
            <span className="text-foreground">DE LA ÉLITE</span>
          </h2>
          <p className="text-foreground/70 max-w-2xl mx-auto">
            Equipos meta-defining creados por los mejores jugadores. Filtra por tier y
            domina cualquier ladder.
          </p>
        </div>

        {/* Tier filters */}
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 mb-10">
          {filters.map((f) => {
            const active = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-5 py-2 rounded-md font-display text-sm tracking-[0.2em] border transition-all ${
                  active
                    ? "bg-primary text-primary-foreground border-primary shadow-[0_0_20px_hsl(var(--primary)/0.6)]"
                    : "bg-card/40 text-foreground/70 border-border hover:border-primary/60 hover:text-foreground"
                }`}
              >
                {f}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((b, i) => (
            <div
              key={b.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <BuildCard build={b} />
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-20">
            No hay builds en este tier todavía.
          </p>
        )}
      </div>
    </section>
  );
};
