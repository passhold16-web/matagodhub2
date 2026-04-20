import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { PokemonSprite } from "./PokemonSprite";
import { AuthorBadge } from "./AuthorBadge";
import {
  STAT_KEYS,
  STAT_LABELS,
  MAX_EV_STAT,
  translateMoveToEs,
  type TeamMember,
} from "@/data/pokemonMeta";
import { Heart, Package, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

interface BuildDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  build: {
    id: string;
    name: string;
    tier: string;
    description: string | null;
    pokemon_ids: number[];
    team_data: TeamMember[] | null;
    votes_count: number;
    author?: { username: string; role: string | null };
  } | null;
}

const MoveLabel = ({ raw }: { raw: string }) => {
  const [label, setLabel] = useState(raw);
  useEffect(() => {
    if (!raw) {
      setLabel("");
      return;
    }
    translateMoveToEs(raw).then(setLabel);
  }, [raw]);
  return <>{label || <span className="text-foreground/30">—</span>}</>;
};

export const BuildDetailModal = ({ open, onOpenChange, build }: BuildDetailModalProps) => {
  if (!build) return null;
  const team = build.team_data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-primary/40 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3 pr-6">
            <div className="min-w-0">
              <DialogTitle className="font-display text-2xl tracking-wider neon-text-red">
                {build.name}
              </DialogTitle>
              <DialogDescription className="text-foreground/60 mt-1">
                {build.description || "Sin descripción"}
              </DialogDescription>
              {build.author && (
                <div className="mt-2">
                  <AuthorBadge
                    username={build.author.username}
                    role={build.author.role}
                  />
                </div>
              )}
            </div>
            <span className={`tier-badge tier-${build.tier} shrink-0`}>{build.tier}</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-foreground/60 mt-2">
            <span className="flex items-center gap-1">
              <Heart size={12} className="text-primary" /> {build.votes_count}
            </span>
          </div>
        </DialogHeader>

        <div className="mt-3">
          {team && team.length === 6 ? (
            <Accordion type="single" collapsible defaultValue="m-0" className="w-full">
              {team.map((m, idx) => {
                const evTotal = STAT_KEYS.reduce((s, k) => s + (m.evs?.[k] || 0), 0);
                return (
                  <AccordionItem
                    key={idx}
                    value={`m-${idx}`}
                    className="border-primary/20"
                  >
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <PokemonSprite id={m.pokemonId} size={36} />
                        <div className="flex-1 min-w-0 text-left">
                          <div className="font-display text-sm tracking-wide capitalize text-foreground truncate">
                            {m.pokemonName || `#${m.pokemonId}`}
                          </div>
                          <div className="text-[10px] text-foreground/50 truncate">
                            {m.nature} · {m.item || "Sin objeto"}
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 px-1">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-1.5 text-foreground/70">
                            <Package size={11} className="text-accent" />
                            <span className="font-display tracking-wider">{m.item || "—"}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-foreground/70">
                            <Sparkles size={11} className="text-accent" />
                            <span className="font-display tracking-wider">{m.nature}</span>
                          </div>
                        </div>

                        <div>
                          <div className="font-display text-[10px] tracking-widest text-foreground/50 mb-1">
                            MOVIMIENTOS
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            {m.moves.map((mv, i) => (
                              <div
                                key={i}
                                className="px-2 py-1 rounded bg-background/60 border border-primary/20 text-xs capitalize text-foreground/90"
                              >
                                <MoveLabel raw={mv} />
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <div className="font-display text-[10px] tracking-widest text-foreground/50">
                              EVs
                            </div>
                            <span className="font-display text-[10px] text-accent">
                              {evTotal}/510
                            </span>
                          </div>
                          <div className="space-y-1">
                            {STAT_KEYS.map((k) => (
                              <div key={k} className="flex items-center gap-2">
                                <span className="font-display text-[10px] tracking-wider w-8 text-foreground/60">
                                  {STAT_LABELS[k]}
                                </span>
                                <Progress
                                  value={((m.evs?.[k] || 0) / MAX_EV_STAT) * 100}
                                  className="h-1.5 flex-1 bg-background/60"
                                />
                                <span className="font-display text-[10px] w-8 text-right text-foreground/70">
                                  {m.evs?.[k] || 0}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <div className="font-display text-[10px] tracking-widest text-foreground/50 mb-1">
                            IVs
                          </div>
                          <div className="grid grid-cols-6 gap-1">
                            {STAT_KEYS.map((k) => (
                              <div
                                key={k}
                                className="rounded bg-background/60 border border-primary/20 text-center py-1"
                              >
                                <div className="font-display text-[9px] text-foreground/50">
                                  {STAT_LABELS[k]}
                                </div>
                                <div className="font-display text-xs text-accent">
                                  {m.ivs?.[k] ?? 31}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          ) : (
            <div className="py-6 text-center text-sm text-foreground/60">
              <div className="grid grid-cols-6 gap-1 max-w-sm mx-auto mb-3">
                {build.pokemon_ids.map((id, i) => (
                  <div
                    key={i}
                    className="aspect-square flex items-center justify-center rounded bg-muted/30"
                  >
                    <PokemonSprite id={id} size={40} />
                  </div>
                ))}
              </div>
              <p className="font-display tracking-wider text-xs text-foreground/50">
                Esta build no tiene datos técnicos detallados.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
