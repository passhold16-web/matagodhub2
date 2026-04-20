import { useMemo, useState, useEffect, useCallback } from "react";
import { TIERS, type Tier } from "@/data/mockBuilds";
import { BuildCard } from "./BuildCard";
import { CreateBuildModal } from "./CreateBuildModal";
import { BuildDetailModal } from "./BuildDetailModal";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import type { TeamMember } from "@/data/pokemonMeta";

type Filter = "ALL" | Tier;

export interface AuthorInfo {
  username: string;
  role: string | null;
}

export interface BuildRow {
  id: string;
  user_id: string;
  name: string;
  tier: string;
  description: string | null;
  pokemon_ids: number[];
  team_data: TeamMember[] | null;
  votes_count: number;
  created_at: string;
  author?: AuthorInfo;
}

export const BuildsGallery = () => {
  const { user } = useAuth();
  const [filter, setFilter] = useState<Filter>("ALL");
  const [builds, setBuilds] = useState<BuildRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailBuild, setDetailBuild] = useState<BuildRow | null>(null);

  const fetchBuilds = useCallback(async () => {
    setLoading(true);
    const { data: buildsData } = await supabase
      .from("builds")
      .select("*")
      .order("created_at", { ascending: false });

    if (!buildsData) {
      setBuilds([]);
      setLoading(false);
      return;
    }

    const userIds = Array.from(new Set(buildsData.map((b) => b.user_id)));
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("user_id, username, role")
      .in("user_id", userIds);

    const authorMap = new Map<string, AuthorInfo>();
    (profilesData ?? []).forEach((p) =>
      authorMap.set(p.user_id, { username: p.username, role: p.role ?? null })
    );

    const enriched = buildsData.map((b) => ({
      ...b,
      author: authorMap.get(b.user_id) ?? { username: "Trainer", role: null },
    })) as unknown as BuildRow[];

    setBuilds(enriched);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBuilds();
  }, [fetchBuilds]);

  const filtered = useMemo(
    () => (filter === "ALL" ? builds : builds.filter((b) => b.tier === filter)),
    [filter, builds]
  );

  const filters: Filter[] = ["ALL", ...TIERS];

  return (
    <section id="builds" className="py-20 md:py-28 relative">
      <div className="container">
        <div className="text-center mb-12">
          <p className="font-display text-xs tracking-[0.4em] text-accent mb-3">
            ◆ COMPETITIVE TEAMS ◆
          </p>
          <h2 className="font-display text-4xl md:text-6xl font-black mb-4">
            <span className="neon-text-red">BUILDS</span>{" "}
            <span className="text-foreground">DE LA ÉLITE</span>
          </h2>
          <p className="text-foreground/70 max-w-2xl mx-auto">
            Equipos meta-defining creados por los mejores jugadores. Filtra por tier y
            domina cualquier ladder.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 mb-10">
          {filters.map((f) => {
            const active = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-5 py-2 rounded-md font-display text-sm tracking-[0.2em] border transition-all ${
                  active
                    ? "bg-primary text-primary-foreground border-primary shadow-[0_0_20px_hsl(var(--primary)/0.6)]"
                    : "bg-card/40 text-foreground/70 border-border hover:border-primary/60 hover:text-foreground"
                }`}
              >
                {f}
              </button>
            );
          })}

          {user && (
            <Button
              onClick={() => setModalOpen(true)}
              className="ml-2 font-display text-sm tracking-[0.2em] bg-gradient-neon text-background hover:opacity-90 shadow-[0_0_15px_hsl(var(--primary)/0.4)]"
            >
              <Plus size={16} className="mr-1" />
              NUEVA BUILD
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((b, i) => (
              <div
                key={b.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <BuildCard
                  build={{
                    id: b.id,
                    name: b.name,
                    author: b.author?.username ?? "Trainer",
                    tier: b.tier as Tier,
                    description: b.description ?? "",
                    pokemonIds: b.pokemon_ids,
                    votes: b.votes_count,
                    views: 0,
                  }}
                  authorRole={b.author?.role ?? null}
                  onOpen={() => setDetailBuild(b)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 space-y-4">
            <p className="text-muted-foreground font-display tracking-wider text-lg">
              Sé el primero en dominar el meta. ¡Crea una build!
            </p>
            {user ? (
              <Button
                onClick={() => setModalOpen(true)}
                className="font-display tracking-[0.3em] bg-gradient-neon text-background hover:opacity-90"
              >
                <Plus size={16} className="mr-1" />
                CREAR BUILD
              </Button>
            ) : (
              <p className="text-foreground/50 text-sm">
                Inicia sesión para crear la primera.
              </p>
            )}
          </div>
        )}
      </div>

      <CreateBuildModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={fetchBuilds}
      />

      <BuildDetailModal
        open={!!detailBuild}
        onOpenChange={(o) => !o && setDetailBuild(null)}
        build={detailBuild}
      />
    </section>
  );
};
