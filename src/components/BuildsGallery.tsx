import { useMemo, useState, useEffect, useCallback } from "react";
import { TIERS, type Tier } from "@/data/mockBuilds";
import { BuildCard } from "./BuildCard";
import { CreateBuildModal, type EditingBuild } from "./CreateBuildModal";
import { BuildDetailModal } from "./BuildDetailModal";
import { LoginWall } from "./LoginWall";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import type { TeamMember } from "@/data/pokemonMeta";

type Filter = Tier;

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
  const { user, loading: authLoading } = useAuth();
  const [filter, setFilter] = useState<Filter>("OU");
  const [builds, setBuilds] = useState<BuildRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EditingBuild | null>(null);
  const [detailBuild, setDetailBuild] = useState<BuildRow | null>(null);
  const [showAll, setShowAll] = useState(false);

  const fetchBuilds = useCallback(async () => {
    setLoading(true);
    const { data: buildsData } = await supabase
      .from("builds")
      .select("*")
      .order("votes_count", { ascending: false })
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

  // Realtime: keep builds list in sync (insert/update/delete).
  // Vote changes are handled per-card by useBuildVote, so we don't refetch
  // the whole list on every like — that caused layout flashes.
  useEffect(() => {
    // Only react to inserts/deletes. Updates (votes_count bumps) are handled
    // per-card by useBuildVote and would otherwise cause the whole list to
    // reorder/refetch on every like, which feels like the screen jumps.
    const channel = supabase
      .channel("builds-list")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "builds" },
        () => void fetchBuilds()
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "builds" },
        () => void fetchBuilds()
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchBuilds]);

  const filtered = useMemo(
    () => builds.filter((b) => b.tier === filter),
    [filter, builds]
  );

  const visible = useMemo(
    () => (showAll ? filtered : filtered.slice(0, 3)),
    [filtered, showAll]
  );

  const filters: Filter[] = [...TIERS];

  const handleEdit = (b: BuildRow) => {
    setEditing({
      id: b.id,
      name: b.name,
      tier: b.tier as Tier,
      description: b.description,
      team_data: b.team_data ?? [],
    });
    setModalOpen(true);
  };

  const handleCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

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

        {!authLoading && !user ? (
          <LoginWall
            title="BUILDS BLOQUEADAS"
            description="Las builds de la élite son contenido exclusivo para la comunidad. Inicia sesión o regístrate gratis para verlas."
          />
        ) : (
          <>
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 mb-10">
          {filters.map((f) => {
            const active = filter === f;
            return (
              <button
                key={f}
                onClick={() => {
                  setFilter(f);
                  setShowAll(false);
                }}
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
              onClick={handleCreate}
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
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visible.map((b, i) => (
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
                    buildId={b.id}
                    ownerId={b.user_id}
                    authorRole={b.author?.role ?? null}
                    onOpen={() => setDetailBuild(b)}
                    onEdit={() => handleEdit(b)}
                    onDeleted={fetchBuilds}
                  />
                </div>
              ))}
            </div>

            {filtered.length > 3 && (
              <div className="flex justify-center mt-10">
                <Button
                  onClick={() => setShowAll((v) => !v)}
                  variant="outline"
                  className="font-display tracking-[0.3em] border-primary/60 text-foreground hover:bg-primary/10 hover:text-foreground"
                >
                  {showAll
                    ? "VER MENOS"
                    : `VER MÁS (${filtered.length - 3})`}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 space-y-4">
            <p className="text-muted-foreground font-display tracking-wider text-lg">
              Sé el primero en dominar el meta. ¡Crea una build!
            </p>
            {user ? (
              <Button
                onClick={handleCreate}
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
          </>
        )}
      </div>

      <CreateBuildModal
        open={modalOpen}
        onOpenChange={(o) => {
          setModalOpen(o);
          if (!o) setEditing(null);
        }}
        onCreated={fetchBuilds}
        editing={editing}
      />

      <BuildDetailModal
        open={!!detailBuild}
        onOpenChange={(o) => !o && setDetailBuild(null)}
        build={detailBuild}
      />
    </section>
  );
};
