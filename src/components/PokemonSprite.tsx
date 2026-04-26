import { useState } from "react";
import { spriteFallback, spriteUrl } from "@/data/mockBuilds";
import { cn } from "@/lib/utils";

interface PokemonSpriteProps {
  id: number;
  size?: number;
  className?: string;
  /** First few sprites in the viewport can opt into eager loading */
  priority?: boolean;
}

// Alternate forms (id >= 10000) don't have animated Gen-5 sprites at the same path,
// so we serve their static official sprite directly.
const isFormId = (id: number) => id >= 10000;
const formSpriteUrl = (id: number) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

export const PokemonSprite = ({ id, size = 64, className, priority = false }: PokemonSpriteProps) => {
  const [errored, setErrored] = useState(false);
  const primary = isFormId(id) ? formSpriteUrl(id) : spriteUrl(id);
  const fallback = isFormId(id) ? formSpriteUrl(id) : spriteFallback(id);
  return (
    <img
      src={errored ? fallback : primary}
      alt={`Pokémon #${id}`}
      width={size}
      height={size}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "low"}
      onError={() => setErrored(true)}
      className={cn("pixelated drop-shadow-[0_0_8px_hsl(var(--primary)/0.4)]", className)}
      style={{ width: size, height: size, objectFit: "contain" }}
    />
  );
};
