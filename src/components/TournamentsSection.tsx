import { useEffect, useState } from "react";
import { Trophy, Calendar, Users, Plus, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { CreateTournamentModal } from "./CreateTournamentModal";
import { useNavigate } from "react-router-dom";

interface TournamentRow {
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

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
};

export const TournamentsSection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState<TournamentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("tournaments")
      .select("*")
      .order("event_date", { ascending: true });

    const rows = (data ?? []) as TournamentRow[];
    if (rows.length > 0) {
      const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, username")
        .in("user_id", userIds);
      const map = new Map((profs ?? []).map((p) => [p.user_id, p.username]));
      rows.forEach((r) => {
        r.author = { username: map.get(r.user_id) ?? "Trainer" };
      });
    }
    setTournaments(rows);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const handleCreate = () => {
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Necesitas una cuenta para publicar un torneo.",
      });
      navigate("/auth");
      return;
    }
    setCreateOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Borrar este torneo?")) return;
    const { error } = await supabase.from("tournaments").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Torneo borrado" });
    void load();
  };

  return (
    <section id="torneos" className="py-20 md:py-28 relative">
      <div className="container">
        <div className="text-center mb-10">
          <p className="font-display text-xs tracking-[0.4em] text-accent mb-3">
            ◆ ARENA OFICIAL ◆
          </p>
          <h2 className="font-display text-4xl md:text-6xl font-black mb-4">
            <span className="text-foreground">TORNEOS</span>{" "}
            <span className="neon-text-gold">ÉLITE</span>
          </h2>
          <p className="text-foreground/70 max-w-2xl mx-auto mb-6">
            Compite contra los mejores. Premios reales. Gloria eterna.
          </p>
          <Button
            onClick={handleCreate}
            className="font-display tracking-[0.3em] bg-gradient-neon text-background hover:opacity-90 shadow-[0_0_20px_hsl(var(--primary)/0.4)]"
          >
            <Plus size={16} className="mr-2" />
            PUBLICAR TORNEO
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={28} className="animate-spin text-primary" />
          </div>
        ) : tournaments.length === 0 ? (
          <div className="text-center py-16 max-w-xl mx-auto">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-neon mb-4 animate-pulse-glow">
              <Trophy className="text-background" size={28} />
            </div>
            <h3 className="font-display text-xl tracking-wider text-foreground/80 mb-2">
              AÚN NO HAY TORNEOS
            </h3>
            <p className="text-foreground/60 text-sm">
              Sé el primero en organizar un torneo y reúne a la comunidad.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tournaments.map((t, i) => {
              const isOwner = user?.id === t.user_id;
              return (
                <article
                  key={t.id}
                  className="glass-strong rounded-lg p-6 group hover:border-accent/60 transition-all animate-fade-in-up"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-12 w-12 rounded-md bg-gradient-neon flex items-center justify-center shadow-[0_0_20px_hsl(var(--primary)/0.5)] shrink-0">
                        <Trophy className="text-background" size={24} />
                      </div>
                      <div className="min-w-0">
                        <span className={`tier-badge tier-${t.tier}`}>{t.tier}</span>
                        <h3 className="font-display text-lg md:text-xl font-bold mt-1 truncate">
                          {t.name}
                        </h3>
                        {t.author && (
                          <p className="font-display text-[10px] tracking-widest text-accent mt-0.5 truncate">
                            POR {t.author.username.toUpperCase()}
                          </p>
                        )}
                      </div>
                    </div>
                    <span
                      className={`font-display text-xs px-3 py-1 rounded-full border tracking-widest shrink-0 ${
                        t.status === "OPEN"
                          ? "border-primary text-primary bg-primary/10"
                          : "border-muted-foreground text-muted-foreground"
                      }`}
                    >
                      {t.status === "OPEN" ? "ABIERTO" : t.status}
                    </span>
                  </div>

                  {t.description && (
                    <p className="text-sm text-foreground/70 mb-4 line-clamp-2">
                      {t.description}
                    </p>
                  )}

                  <div className="grid grid-cols-3 gap-3 text-sm mb-5">
                    <div className="flex items-center gap-1.5 text-foreground/80">
                      <Calendar size={14} className="text-accent shrink-0" />
                      <span className="font-display tracking-wider text-xs truncate">
                        {formatDate(t.event_date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-foreground/80">
                      <Users size={14} className="text-accent shrink-0" />
                      <span className="font-display tracking-wider text-xs">
                        {t.max_players}
                      </span>
                    </div>
                    <div className="text-right">
                      {t.prize && (
                        <span className="font-display neon-text-gold tracking-wider text-xs">
                          {t.prize}
                        </span>
                      )}
                    </div>
                  </div>

                  {t.format && (
                    <p className="text-[10px] font-display tracking-widest text-foreground/50 mb-3">
                      FORMATO: {t.format}
                    </p>
                  )}

                  <div className="flex gap-2">
                    {t.contact_url ? (
                      <a
                        href={t.contact_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1"
                      >
                        <Button
                          variant="outline"
                          className="w-full font-display tracking-widest border-primary/60 text-foreground hover:bg-primary hover:text-primary-foreground"
                        >
                          <ExternalLink size={14} className="mr-2" />
                          INSCRIBIRSE
                        </Button>
                      </a>
                    ) : (
                      <Button
                        variant="outline"
                        disabled
                        className="flex-1 font-display tracking-widest border-muted text-muted-foreground"
                      >
                        SIN ENLACE
                      </Button>
                    )}
                    {isOwner && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(t.id)}
                        className="text-destructive hover:bg-destructive/10"
                        aria-label="Borrar torneo"
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <CreateTournamentModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={load}
      />
    </section>
  );
};
