import { formatWinRate } from "@/lib/combatStats";

interface CombatRecordProps {
  wins: number;
  losses: number;
  className?: string;
}

export const CombatRecord = ({ wins, losses, className = "" }: CombatRecordProps) => {
  return (
    <p className={`text-sm text-foreground/80 ${className}`}>
      <span className="text-primary">🟢 {wins} Wins</span>
      <span className="text-foreground/40 mx-2">/</span>
      <span className="text-destructive">🔴 {losses} Losses</span>
      <span className="text-foreground/50 mx-2">·</span>
      <span className="font-display text-xs tracking-widest text-accent">
        Win Rate {formatWinRate(wins, losses)}
      </span>
    </p>
  );
};
