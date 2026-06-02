import { Link } from "react-router-dom";
import { Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ChallengeWithProfiles } from "@/types/challenges";
import { buildArenaHeadline, buildSpectatorAnnouncement } from "@/lib/challengeHelpers";

interface Props {
  challenge: ChallengeWithProfiles;
  currentUserId?: string | null;
  onAccept?: (id: string) => void;
  accepting?: boolean;
}

const STATUS_LABEL: Record<string, string> = {
  pendiente: "PENDIENTE",
  aceptado: "EN CURSO",
  completado: "FINALIZADO",
  cancelado: "CANCELADO",
  disputa: "DISPUTA",
};

export const ChallengeCard = ({
  challenge: c,
  currentUserId,
  onAccept,
  accepting,
}: Props) => {
  const canAccept =
    c.status === "pendiente" &&
    currentUserId &&
    currentUserId !== c.challenger_id &&
    (!c.opponent_id || c.opponent_id === currentUserId);

  const spectator = buildSpectatorAnnouncement(c);

  return (
    <article className="neon-border rounded-lg bg-card/80 backdrop-blur-xl p-5 flex flex-col gap-4 hover:-translate-y-0.5 transition-transform">
      <div className="flex items-start justify-between gap-2">
        <Swords className="text-primary shrink-0" size={22} />
        <span className="font-display text-[10px] tracking-widest px-2 py-0.5 rounded border border-primary/40 text-primary">
          {STATUS_LABEL[c.status] ?? c.status}
        </span>
      </div>

      <p className="font-display text-sm md:text-base tracking-wide text-foreground leading-snug">
        {buildArenaHeadline(c)}
      </p>

      {spectator && c.status === "aceptado" && c.meet_confirmed_at && (
        <p className="text-xs text-accent border border-accent/30 rounded-md p-2 bg-accent/5">
          📣 {spectator} — ¡Ven a verlos!
        </p>
      )}

      <div className="flex flex-wrap gap-2 mt-auto">
        <Button asChild size="sm" variant="outline" className="font-display text-[10px] tracking-widest">
          <Link to={`/desafios/${c.id}`}>VER DETALLE</Link>
        </Button>
        {canAccept && onAccept && (
          <Button
            size="sm"
            onClick={() => onAccept(c.id)}
            disabled={accepting}
            className="font-display text-[10px] tracking-widest bg-gradient-neon text-background"
          >
            ACEPTAR DESAFÍO
          </Button>
        )}
      </div>
    </article>
  );
};
