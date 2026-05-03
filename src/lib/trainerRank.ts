import { Sparkles, Sword, Medal, Trophy, type LucideIcon } from "lucide-react";

export interface TrainerRank {
  key: "nub" | "guay" | "veterano" | "elite";
  label: string;
  /** Inclusive lower bound for builds count */
  min: number;
  icon: LucideIcon;
  /** Tailwind classes for border/text/bg accent */
  tone: string;
  /** Short description shown in tooltips */
  description: string;
}

export const TRAINER_RANKS: TrainerRank[] = [
  {
    key: "nub",
    label: "ENTRENADOR NUB",
    min: 0,
    icon: Sparkles,
    tone: "text-foreground/70 border-foreground/30 bg-foreground/5",
    description: "Acaba de empezar su viaje. Publica tu primera build para subir.",
  },
  {
    key: "guay",
    label: "ENTRENADOR GUAY",
    min: 1,
    icon: Sword,
    tone: "text-primary border-primary/50 bg-primary/10",
    description: "Ya tiene builds publicadas. Sigue compartiendo para escalar.",
  },
  {
    key: "veterano",
    label: "VETERANO",
    min: 3,
    icon: Medal,
    tone: "text-accent border-accent/50 bg-accent/10",
    description: "Trainer con experiencia y varias builds publicadas.",
  },
  {
    key: "elite",
    label: "ÉLITE",
    min: 6,
    icon: Trophy,
    tone: "text-accent border-accent/70 bg-accent/15 neon-text-gold",
    description: "Maestro pokémon. Una de las mentes más activas de la comunidad.",
  },
];

export const getTrainerRank = (buildCount: number): TrainerRank => {
  let current = TRAINER_RANKS[0];
  for (const r of TRAINER_RANKS) {
    if (buildCount >= r.min) current = r;
  }
  return current;
};

export const getNextRank = (buildCount: number): TrainerRank | null => {
  const current = getTrainerRank(buildCount);
  const idx = TRAINER_RANKS.findIndex((r) => r.key === current.key);
  return TRAINER_RANKS[idx + 1] ?? null;
};
