import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PokemonSprite } from "./PokemonSprite";
import { supabase } from "@/integrations/supabase/client";

interface HeroProps {
  onPrimary: () => void;
  onSecondary: () => void;
}

interface Stats {
  builds: number;
  torneos: number;
  jugadores: number;
}

export const Hero = ({ onPrimary, onSecondary }: HeroProps) => {
  const [stats, setStats] = useState<Stats>({ builds: 0, torneos: 0, jugadores: 0 });

  const loadStats = async () => {
    const [b, t, p] = await Promise.all([
      supabase.from("builds").select("*", { count: "exact", head: true }),
      supabase.from("tournaments").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
    ]);
    setStats({
      builds: b.count ?? 0,
      torneos: t.count ?? 0,
      jugadores: p.count ?? 0,
    });
  };

  useEffect(() => {
    void loadStats();

    const channel = supabase
      .channel("home-stats")
      .on("postgres_changes", { event: "*", schema: "public", table: "builds" }, () => void loadStats())
      .on("postgres_changes", { event: "*", schema: "public", table: "tournaments" }, () => void loadStats())
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => void loadStats())
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const cards: { v: number; l: string }[] = [
    { v: stats.builds, l: "BUILDS" },
    { v: stats.torneos, l: "TORNEOS" },
    { v: stats.jugadores, l: "JUGADORES" },
  ];

  return (
    <section
      id="home"
      className="relative min-h-[100svh] flex items-center justify-center overflow-hidden pt-16"
    >
      {/* Radial glow backdrop */}
      <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />

      {/* Orbital rings — centered, decorative */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-60">
        <div className="w-[320px] h-[320px] md:w-[520px] md:h-[520px] rounded-full border border-primary/20 animate-[spin_40s_linear_infinite]" />
        <div className="absolute inset-8 rounded-full border border-accent/15 animate-[spin_30s_linear_infinite_reverse]" />
        <div className="absolute inset-16 rounded-full border border-primary/10 animate-[spin_50s_linear_infinite]" />
      </div>

      {/* Mewtwo — top-right decorative, behind content */}
      <div className="absolute -right-6 top-20 md:right-8 md:top-24 lg:right-16 lg:top-28 pointer-events-none animate-float z-0">
        <div className="relative">
          <div className="absolute inset-0 blur-3xl bg-primary/30 rounded-full scale-150" />
          <PokemonSprite
            id={150}
            size={140}
            priority
            className="relative drop-shadow-[0_0_40px_hsl(var(--primary))] opacity-60 md:opacity-70 md:w-[180px] md:h-[180px] lg:w-[220px] lg:h-[220px]"
          />
        </div>
      </div>

      <div className="container relative z-10 text-center px-4 animate-fade-in-up">
        <p className="font-display text-xs md:text-sm tracking-[0.4em] text-accent mb-4">
          ▰▰▰  POKEMMO COMPETITIVE NETWORK  ▰▰▰
        </p>

        <h1 className="font-display font-black text-5xl sm:text-7xl md:text-8xl lg:text-9xl leading-none mb-6">
          <span className="glitch block" data-text="MATAGOD">MATAGOD</span>
          <span className="block neon-text-gold text-3xl sm:text-5xl md:text-6xl mt-2 tracking-[0.3em]">
            HUB
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-base md:text-xl text-foreground/80 mb-8 font-body">
          Domina el meta competitivo. Equipos forjados por la élite.{" "}
          <span className="neon-text-red font-semibold">Victoria garantizada</span> o
          extinción.
        </p>

        {/* Stats — lifted up to take marquee's old space */}
        <div className="mb-10 grid grid-cols-3 gap-3 md:gap-4 max-w-xl mx-auto text-center">
          {cards.map((s) => (
            <div
              key={s.l}
              className="glass rounded-lg py-3 border border-primary/20 hover:border-primary/60 transition-all"
            >
              <div className="font-display text-2xl md:text-3xl neon-text-gold">
                {s.v.toLocaleString()}
              </div>
              <div className="text-[10px] md:text-xs tracking-[0.2em] text-muted-foreground mt-1">
                {s.l}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            size="lg"
            onClick={onPrimary}
            className="font-display tracking-widest bg-primary text-primary-foreground shadow-[0_0_30px_hsl(var(--primary)/0.6)] hover:bg-primary hover:shadow-[0_0_60px_hsl(var(--primary)/1)] hover:scale-[1.03] transition-all duration-300"
          >
            EXPLORAR BUILDS
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={onSecondary}
            className="font-display tracking-widest border-accent text-accent hover:bg-accent/10 hover:text-accent shadow-[0_0_20px_hsl(var(--accent)/0.4)] hover:shadow-[0_0_45px_hsl(var(--accent)/0.9)] hover:scale-[1.03] transition-all duration-300"
          >
            VER TORNEOS
          </Button>
        </div>
      </div>

      {/* Scanline */}
      <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent 0, transparent 2px, hsl(var(--primary)/0.1) 2px, hsl(var(--primary)/0.1) 3px)' }}
      />
    </section>
  );
};
