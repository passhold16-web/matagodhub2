import { useState } from "react";
import { spriteFallback, spriteUrl } from "@/data/mockBuilds";
import { cn } from "@/lib/utils";

interface PokemonSpriteProps {
  id: number;
  size?: number;
  className?: string;
}

export const PokemonSprite = ({ id, size = 64, className }: PokemonSpriteProps) => {
  const [errored, setErrored] = useState(false);
  return (
    <img
      src={errored ? spriteFallback(id) : spriteUrl(id)}
      alt={`Pokémon #${id}`}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setErrored(true)}
      className={cn("pixelated drop-shadow-[0_0_8px_hsl(var(--primary)/0.4)]", className)}
      style={{ width: size, height: size, objectFit: "contain" }}
    />
  );
};
