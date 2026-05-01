import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  Calendar,
  Users,
  ExternalLink,
  Gift,
  ScrollText,
  MapPin,
  UserPlus,
} from "lucide-react";
import { UsernameLink } from "@/components/UsernameLink";

interface TournamentLike {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  tier: string;
  event_date: string;
  max_players: number;
  prize: string | null;
  format: string | null;
  contact_url: string | null;
  status: string;
  author?: { username: string } | null;
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  tournament: TournamentLike | null;
  participantCount: number;
  onRegister?: () => void;
}

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleString("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
};

export const TournamentDetailModal = ({
  open,
  onOpenChange,
  tournament: t,
  participantCount,
  onRegister,
}: Props) => {
  if (!t) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-accent/40 max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-md bg-gradient-neon flex items-center justify-center shadow-[0_0_20px_hsl(var(--primary)/0.5)] shrink-0">
              <Trophy className="text-background" size={24} />
            </div>
            <div className="min-w-0 flex-1">
              <span className={`tier-badge tier-${t.tier}`}>{t.tier}</span>
              <DialogTitle className="font-display text-2xl tracking-wider mt-1 neon-text-gold">
                {t.name}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {t.author && (
                  <span className="font-display text-[10px] tracking-widest text-accent">
                    POR{" "}
                    <UsernameLink username={t.author.username} className="text-accent">
                      {t.author.username.toUpperCase()}
                    </UsernameLink>
                  </span>
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 p-3 rounded-md bg-background/40 border border-primary/15">
              <Calendar size={16} className="text-accent shrink-0" />
              <div>
                <p className="font-display text-[9px] tracking-widest text-foreground/50">FECHA</p>
                <p className="font-display tracking-wide text-xs">{formatDate(t.event_date)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-md bg-background/40 border border-primary/15">
              <Users size={16} className="text-accent shrink-0" />
              <div>
                <p className="font-display text-[9px] tracking-widest text-foreground/50">CUPOS</p>
                <p className="font-display tracking-wide text-xs">
                  {participantCount}/{t.max_players}
                </p>
              </div>
            </div>
          </div>

          {t.description && (
            <section>
              <h3 className="font-display text-xs tracking-widest text-primary mb-2 flex items-center gap-2">
                <ScrollText size={14} /> DESCRIPCIÓN
              </h3>
              <p className="text-sm text-foreground/80 whitespace-pre-wrap">{t.description}</p>
            </section>
          )}

          {t.prize && (
            <section>
              <h3 className="font-display text-xs tracking-widest text-primary mb-2 flex items-center gap-2">
                <Gift size={14} /> RECOMPENSAS
              </h3>
              <p className="text-sm neon-text-gold font-display tracking-wider">{t.prize}</p>
            </section>
          )}

          {t.format && (
            <section>
              <h3 className="font-display text-xs tracking-widest text-primary mb-2 flex items-center gap-2">
                <ScrollText size={14} /> FORMATO Y REGLAS
              </h3>
              <p className="text-sm text-foreground/80 whitespace-pre-wrap">{t.format}</p>
            </section>
          )}

          {t.contact_url && (
            <section>
              <h3 className="font-display text-xs tracking-widest text-primary mb-2 flex items-center gap-2">
                <MapPin size={14} /> UBICACIÓN / CANAL
              </h3>
              <a
                href={t.contact_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline break-all"
              >
                {t.contact_url}
                <ExternalLink size={12} />
              </a>
            </section>
          )}

          <div className="flex gap-2 pt-2 border-t border-primary/10">
            <Button
              type="button"
              onClick={() => {
                onOpenChange(false);
                onRegister?.();
              }}
              className="flex-1 font-display tracking-widest bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_hsl(var(--primary)/0.5)]"
            >
              <UserPlus size={14} className="mr-2" />
              INSCRIBIRSE
            </Button>
            {t.contact_url && (
              <a href={t.contact_url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="icon" className="border-accent/60 text-accent hover:bg-accent/10">
                  <ExternalLink size={14} />
                </Button>
              </a>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
