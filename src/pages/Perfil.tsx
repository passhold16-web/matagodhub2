import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BuildCard } from "@/components/BuildCard";
import { BuildDetailModal } from "@/components/BuildDetailModal";
import { CreateBuildModal, type EditingBuild } from "@/components/CreateBuildModal";
import { Button } from "@/components/ui/button";
import { TrainerBadge } from "@/components/TrainerBadge";
import { CombatRecord } from "@/components/challenges/CombatRecord";
import { displayPokemmoNick } from "@/lib/combatStats";
import {
  Loader2,
  ArrowLeft,
  Crown,
  Youtube,
  ShieldCheck,
  User as UserIcon,
  Mail,
} from "lucide-react";
import type { Tier } from "@/data/mockBuilds";
import type { TeamMember } from "@/data/pokemonMeta";
import type { BuildRow } from "@/components/BuildsGallery";

interface ProfileData {
  user_id: string;
  username: string;
  bio: string | null;
  avatar_url: string | null;
  role: string;
  wins: number;
  losses: number;
  pokemmo_nick: string | null;
}

const ROLE_BADGES: Record<string, { label: string; icon: typeof Crown; tone: string }> = {
  admin: { label: "ADMINISTRADOR", icon: ShieldCheck, tone: "text-accent border-accent/60 bg-accent/10" },
  youtuber: { label: "YOUTUBER", icon: Youtube, tone: "text-primary border-primary/60 bg-primary/10" },
  mod: { label: "MODERADOR", icon: Crown, tone: "text-accent border-accent/60 bg-accent/10" },
};

const Perfil = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [builds, setBuilds] = useState<BuildRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [detailBuild, setDetailBuild] = useState<BuildRow | null>(null);
  const [editing, setEditing] = useState<EditingBuild | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const loadProfile = async () => {
    if (!username) return;
    setLoading(true);
    setNotFound(false);

    // Case-insensitive lookup; pick the first match in case of legacy duplicates
    const { data: profs } = await supabase
      .from("profiles")
      .select("user_id, username, bio, avatar_url, role, wins, losses, pokemmo_nick")
      .ilike("username", username)
      .limit(1);

    const prof = profs?.[0];
    if (!prof) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setProfile(prof as ProfileData);

    const { data: buildsData } = await supabase
      .from("builds")
      .select("*")
      .eq("user_id", prof.user_id)
      .order("created_at", { ascending: false });

    const enriched =
      (buildsData ?? []).map((b) => ({
        ...b,
        author: { username: prof.username, role: prof.role ?? null },
      })) as unknown as BuildRow[];

    setBuilds(enriched);
    setLoading(false);
  };

  useEffect(() => {
    void loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  const roleMeta = profile ? ROLE_BADGES[profile.role?.toLowerCase()] : undefined;
  const RoleIcon = roleMeta?.icon;

  const handleEdit = (b: BuildRow) => {
    setEditing({
      id: b.id,
      name: b.name,
      tier: b.tier as Tier,
      description: b.description,
      team_data: (b.team_data as TeamMember[]) ?? [],
    });
    setEditOpen(true);
  };

  return (
    <div className="min-h-screen bg-background relative">
      <div className="grid-bg fixed inset-0 pointer-events-none opacity-60" />
      <Navbar active="" onNavigate={() => navigate("/")} />

      <main className="relative pt-24 pb-20">
        <div className="container max-w-5xl">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-foreground/60 hover:text-primary transition-colors mb-6 font-display tracking-widest text-xs"
          >
            <ArrowLeft size={14} /> VOLVER
          </Link>

          {loading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 size={32} className="animate-spin text-primary" />
            </div>
          ) : notFound || !profile ? (
            <div className="text-center py-32 space-y-3">
              <h1 className="font-display text-3xl neon-text-red">TRAINER NO ENCONTRADO</h1>
              <p className="text-foreground/60">No existe ningún perfil con ese nombre.</p>
            </div>
          ) : (
            <>
              {/* Profile header */}
              <header className="neon-border bg-card/80 backdrop-blur-xl rounded-lg p-6 md:p-8 mb-10">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                  <div className="h-24 w-24 md:h-28 md:w-28 rounded-full bg-gradient-neon flex items-center justify-center shrink-0 shadow-[0_0_30px_hsl(var(--primary)/0.5)]">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.username}
                        className="h-full w-full object-cover rounded-full"
                      />
                    ) : (
                      <UserIcon size={48} className="text-background" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap">
                      <h1 className="font-display text-3xl md:text-4xl tracking-wider neon-text-gold">
                        {profile.username}
                      </h1>
                      {roleMeta && RoleIcon && (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-display tracking-widest ${roleMeta.tone}`}
                        >
                          <RoleIcon size={10} />
                          {roleMeta.label}
                        </span>
                      )}
                    </div>
                    <p className="mt-3 text-foreground/70 max-w-xl">
                      {profile.bio || "Este trainer aún no ha escrito su bio."}
                    </p>
                    <div className="mt-4 flex flex-col items-center md:items-start gap-2">
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                        <TrainerBadge buildCount={builds.length} size="md" showProgress />
                        <span className="font-display text-xs tracking-widest text-accent">
                          · {builds.length} {builds.length === 1 ? "BUILD PUBLICADA" : "BUILDS PUBLICADAS"}
                        </span>
                      </div>
                      <CombatRecord wins={profile.wins ?? 0} losses={profile.losses ?? 0} />
                      {profile.pokemmo_nick && (
                        <p className="text-[10px] font-display tracking-widest text-foreground/50">
                          Nick PokéMMO: {displayPokemmoNick(profile.pokemmo_nick, profile.username)}
                        </p>
                      )}
                    </div>
                    {currentUser && currentUser.id !== profile.user_id && (
                      <div className="mt-5 flex justify-center md:justify-start">
                        <Button
                          onClick={() =>
                            navigate(`/mensajes/${encodeURIComponent(profile.username)}`)
                          }
                          className="font-display tracking-widest bg-gradient-neon text-background hover:opacity-90 shadow-[0_0_20px_hsl(var(--primary)/0.5)] hover:shadow-[0_0_30px_hsl(var(--primary)/0.8)] transition-all hover:scale-105"
                        >
                          <Mail size={14} className="mr-2" />
                          ENVIAR MENSAJE
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </header>

              {/* Builds grid */}
              {builds.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {builds.map((b) => (
                    <BuildCard
                      key={b.id}
                      build={{
                        id: b.id,
                        name: b.name,
                        author: profile.username,
                        tier: b.tier as Tier,
                        description: b.description ?? "",
                        pokemonIds: b.pokemon_ids,
                        votes: b.votes_count,
                        views: 0,
                      }}
                      buildId={b.id}
                      ownerId={b.user_id}
                      authorRole={profile.role}
                      onOpen={() => setDetailBuild(b)}
                      onEdit={() => handleEdit(b)}
                      onDeleted={loadProfile}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-foreground/60 font-display tracking-wider">
                  Aún no ha publicado ninguna build.
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />

      <BuildDetailModal
        open={!!detailBuild}
        onOpenChange={(o) => !o && setDetailBuild(null)}
        build={detailBuild}
      />

      <CreateBuildModal
        open={editOpen}
        onOpenChange={(o) => {
          setEditOpen(o);
          if (!o) setEditing(null);
        }}
        onCreated={loadProfile}
        editing={editing}
      />
    </div>
  );
};

export default Perfil;
