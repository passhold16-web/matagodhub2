import { Button } from "@/components/ui/button";
import { PokemonSprite } from "./PokemonSprite";

interface HeroProps {
  onPrimary: () => void;
  onSecondary: () => void;
}

export const Hero = ({ onPrimary, onSecondary }: HeroProps) => {
  return (
    <section
      id="home"
      className="relative min-h-[100svh] flex items-center justify-center overflow-hidden pt-16"
    >
      {/* Radial glow backdrop */}
      <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />

      {/* Orbital rings */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className="w-[320px] h-[320px] md:w-[520px] md:h-[520px] rounded-full border border-primary/20 animate-[spin_40s_linear_infinite]" />
        <div className="absolute inset-8 rounded-full border border-accent/15 animate-[spin_30s_linear_infinite_reverse]" />
        <div className="absolute inset-16 rounded-full border border-primary/10 animate-[spin_50s_linear_infinite]" />
      </div>

      {/* Mewtwo orbital — uses sprite #150 large */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none animate-float">
        <div className="relative">
          <div className="absolute inset-0 blur-3xl bg-primary/40 rounded-full scale-150" />
          <PokemonSprite id={150} size={220} className="relative drop-shadow-[0_0_40px_hsl(var(--primary))]" />
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

        <p className="max-w-2xl mx-auto text-base md:text-xl text-foreground/80 mb-10 font-body">
          Domina el meta competitivo. Equipos forjados por la élite.{" "}
          <span className="neon-text-red font-semibold">Victoria garantizada</span> o
          extinción.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            size="lg"
            onClick={onPrimary}
            className="font-display tracking-widest bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_30px_hsl(var(--primary)/0.6)] hover:shadow-[0_0_50px_hsl(var(--primary)/0.9)] transition-all"
          >
            EXPLORAR BUILDS
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={onSecondary}
            className="font-display tracking-widest border-accent text-accent hover:bg-accent/10 hover:text-accent shadow-[0_0_20px_hsl(var(--accent)/0.4)]"
          >
            VER TORNEOS
          </Button>
        </div>

        <div className="mt-16 grid grid-cols-3 gap-4 max-w-xl mx-auto text-center">
          {[
            { v: "1.2K+", l: "BUILDS" },
            { v: "48", l: "TORNEOS" },
            { v: "9.8K", l: "PLAYERS" },
          ].map((s) => (
            <div key={s.l} className="glass rounded-lg py-3">
              <div className="font-display text-2xl md:text-3xl neon-text-gold">{s.v}</div>
              <div className="text-xs tracking-[0.2em] text-muted-foreground mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scanline */}
      <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent 0, transparent 2px, hsl(var(--primary)/0.1) 2px, hsl(var(--primary)/0.1) 3px)' }}
      />
    </section>
  );
};
