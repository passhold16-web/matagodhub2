import { Check } from "lucide-react";
import type { ChallengeRow } from "@/types/challenges";
import { getCurrentStep } from "@/lib/challengeHelpers";

const STEPS = [
  { n: 1, title: "Lanzar / Aceptar Reto" },
  { n: 2, title: "Acordar el Duelo" },
  { n: 3, title: "¡Cita Confirmada!" },
  { n: 4, title: "Reportar Resultado" },
] as const;

interface Props {
  challenge: ChallengeRow;
}

export const ChallengeSteps = ({ challenge }: Props) => {
  const current = getCurrentStep(challenge);

  return (
    <ol className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-8">
      {STEPS.map((s) => {
        const done = s.n < current || (s.n === current && challenge.status === "completado");
        const active = s.n === current && challenge.status !== "completado" && challenge.status !== "cancelado";
        return (
          <li
            key={s.n}
            className={`rounded-lg border p-3 text-center transition-all ${
              done
                ? "border-primary/50 bg-primary/10"
                : active
                  ? "border-accent/60 bg-accent/10 shadow-[0_0_15px_hsl(var(--accent)/0.25)]"
                  : "border-border/50 bg-card/40 opacity-60"
            }`}
          >
            <div className="flex items-center justify-center gap-1 mb-1">
              {done ? (
                <Check size={14} className="text-primary" />
              ) : (
                <span className="font-display text-[10px] text-foreground/50">PASO {s.n}</span>
              )}
            </div>
            <p className="font-display text-[9px] md:text-[10px] tracking-wider leading-tight">
              {s.title}
            </p>
          </li>
        );
      })}
    </ol>
  );
};
