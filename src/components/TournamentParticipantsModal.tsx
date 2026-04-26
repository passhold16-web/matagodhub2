import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { UsernameLink } from "@/components/UsernameLink";
import { Trophy, Users } from "lucide-react";

export interface ParticipantEntry {
  id: string;
  user_id: string;
  pokemmo_nick: string;
  description: string;
  created_at: string;
  username?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  tournamentName?: string;
  participants: ParticipantEntry[];
}

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
};

export const TournamentParticipantsModal = ({
  open,
  onOpenChange,
  tournamentName,
  participants,
}: Props) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-primary/40 max-w-2xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-md bg-gradient-neon flex items-center justify-center shadow-[0_0_15px_hsl(var(--primary)/0.5)] shrink-0">
              <Trophy size={18} className="text-background" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="font-display tracking-widest neon-text-gold truncate">
                PARTICIPANTES
              </DialogTitle>
              <DialogDescription className="font-display text-[11px] tracking-widest text-foreground/60 truncate">
                {tournamentName ?? "Torneo"}
              </DialogDescription>
            </div>
            <span className="ml-auto flex items-center gap-1.5 font-display text-xs tracking-widest text-accent shrink-0">
              <Users size={14} />
              {participants.length}
            </span>
          </div>
        </DialogHeader>

        <div className="mt-2 space-y-3">
          {participants.length === 0 ? (
            <div className="text-center py-10">
              <p className="font-display tracking-widest text-foreground/60 text-sm">
                NADIE SE HA INSCRITO TODAVÍA
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                ¡Sé el primero en apuntarte!
              </p>
            </div>
          ) : (
            participants.map((r) => (
              <article
                key={r.id}
                className="rounded-md border border-primary/20 bg-background/50 p-4 hover:border-primary/50 transition-colors"
              >
                <header className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                  <UsernameLink
                    username={r.username ?? "Trainer"}
                    className="font-display text-sm tracking-widest text-accent"
                  >
                    {(r.username ?? "TRAINER").toUpperCase()}
                  </UsernameLink>
                  <span className="font-display text-[10px] tracking-widest text-muted-foreground">
                    {formatDate(r.created_at)}
                  </span>
                </header>

                <div className="inline-flex items-center gap-2 mb-3 px-2.5 py-1 rounded border border-primary/30 bg-primary/5">
                  <span className="font-display text-[9px] tracking-widest text-primary/70">
                    POKEMMO
                  </span>
                  <span className="font-display text-xs tracking-wider text-primary">
                    {r.pokemmo_nick}
                  </span>
                </div>

                <p className="text-sm text-foreground/85 whitespace-pre-wrap break-words leading-relaxed">
                  {r.description}
                </p>
              </article>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
