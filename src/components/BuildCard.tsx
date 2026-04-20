import { Heart, Eye, User } from "lucide-react";
import type { Build } from "@/data/mockBuilds";
import { PokemonSprite } from "./PokemonSprite";

interface BuildCardProps {
  build: Build;
}

export const BuildCard = ({ build }: BuildCardProps) => {
  return (
    <article className="neon-border bg-card/80 backdrop-blur-xl p-5 rounded-lg group transition-transform hover:-translate-y-1 duration-300">
      <header className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-display text-lg font-bold tracking-wide text-foreground group-hover:neon-text-red transition-all">
            {build.name}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <User size={12} />
            <span>{build.author}</span>
          </div>
        </div>
        <span className={`tier-badge tier-${build.tier}`}>{build.tier}</span>
      </header>

      <p className="text-sm text-foreground/70 mb-4 line-clamp-2 min-h-[2.5rem]">
        {build.description}
      </p>

      <div className="grid grid-cols-6 gap-1 p-2 rounded-md bg-background/60 border border-primary/10 mb-4">
        {build.pokemonIds.map((id, idx) => (
          <div
            key={`${build.id}-${id}-${idx}`}
            className="aspect-square flex items-center justify-center rounded bg-muted/30 hover:bg-primary/10 transition-colors"
          >
            <PokemonSprite id={id} size={48} />
          </div>
        ))}
      </div>

      <footer className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Heart size={14} className="text-primary" />
            <span className="font-display">{build.votes.toLocaleString()}</span>
          </span>
          <span className="flex items-center gap-1">
            <Eye size={14} className="text-accent" />
            <span className="font-display">{build.views.toLocaleString()}</span>
          </span>
        </div>
        <button className="font-display tracking-wider text-primary hover:text-accent transition-colors">
          VER →
        </button>
      </footer>
    </article>
  );
};
