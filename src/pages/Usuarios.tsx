import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePresence } from "@/hooks/usePresence";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Crown,
  Loader2,
  Mail,
  Search,
  ShieldCheck,
  User as UserIcon,
  Youtube,
} from "lucide-react";

interface UserRow {
  user_id: string;
  username: string;
  bio: string | null;
  avatar_url: string | null;
  role: string;
  build_count: number;
}

const ROLE_BADGES: Record<string, { label: string; icon: typeof Crown; tone: string }> = {
  admin: { label: "ADMIN", icon: ShieldCheck, tone: "text-accent border-accent/60 bg-accent/10" },
  youtuber: { label: "YT", icon: Youtube, tone: "text-primary border-primary/60 bg-primary/10" },
  mod: { label: "MOD", icon: Crown, tone: "text-accent border-accent/60 bg-accent/10" },
};

const Usuarios = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { isOnline, count: onlineCount } = usePresence();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, username, bio, avatar_url, role")
        .order("created_at", { ascending: false });

      if (!profs) {
        setUsers([]);
        setLoading(false);
        return;
      }

      const ids = profs.map((p) => p.user_id);
      const { data: builds } = await supabase
        .from("builds")
        .select("user_id")
        .in("user_id", ids);

      const counts = new Map<string, number>();
      (builds ?? []).forEach((b) => {
        counts.set(b.user_id, (counts.get(b.user_id) ?? 0) + 1);
      });

      setUsers(
        profs.map((p) => ({
          ...(p as Omit<UserRow, "build_count">),
          build_count: counts.get(p.user_id) ?? 0,
        }))
      );
      setLoading(false);
    };
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        (u.bio ?? "").toLowerCase().includes(q)
    );
  }, [users, query]);

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

          <header className="mb-8">
            <h1 className="font-display text-3xl md:text-4xl tracking-wider neon-text-gold">
              TRAINERS
            </h1>
            <p className="text-foreground/60 mt-2">
              Explora a todos los entrenadores de la comunidad y envíales un mensaje.
            </p>
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-md glass border border-primary/30">
              <span className="relative flex items-center justify-center">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="absolute h-3 w-3 rounded-full bg-primary/40 animate-ping" />
              </span>
              <span className="font-display text-[10px] tracking-widest text-primary">
                {onlineCount} EN LÍNEA AHORA
              </span>
            </div>
          </header>

          <div className="relative mb-6">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50 pointer-events-none"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre o bio..."
              className="pl-9 bg-card/60 border-primary/30"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 size={32} className="animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-foreground/60 font-display tracking-wider">
              No se han encontrado trainers.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((u) => {
                const meta = ROLE_BADGES[u.role?.toLowerCase()];
                const RoleIcon = meta?.icon;
                const isMe = currentUser?.id === u.user_id;
                return (
                  <article
                    key={u.user_id}
                    className="neon-border bg-card/80 backdrop-blur-xl rounded-lg p-4 flex flex-col gap-3 transition-transform hover:-translate-y-1 duration-300"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <Link
                          to={`/perfil/${encodeURIComponent(u.username)}`}
                          className="h-14 w-14 rounded-full bg-gradient-neon flex items-center justify-center shadow-[0_0_15px_hsl(var(--primary)/0.4)] overflow-hidden block"
                          aria-label={`Ver perfil de ${u.username}`}
                        >
                          {u.avatar_url ? (
                            <img
                              src={u.avatar_url}
                              alt={u.username}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <UserIcon size={26} className="text-background" />
                          )}
                        </Link>
                        {isOnline(u.user_id) && (
                          <span
                            className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-primary border-2 border-background shadow-[0_0_8px_hsl(var(--primary))]"
                            title="En línea"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/perfil/${encodeURIComponent(u.username)}`}
                          className="font-display tracking-wider text-accent no-underline hover:no-underline truncate block"
                        >
                          {u.username}
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {meta && RoleIcon && (
                            <span
                              className={`inline-flex items-center gap-0.5 px-1.5 py-px rounded-sm border text-[9px] font-display tracking-widest ${meta.tone}`}
                            >
                              <RoleIcon size={9} />
                              {meta.label}
                            </span>
                          )}
                          <span className="text-[10px] font-display tracking-widest text-foreground/50">
                            {u.build_count} {u.build_count === 1 ? "BUILD" : "BUILDS"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-foreground/70 line-clamp-2 min-h-[2rem]">
                      {u.bio || "Este trainer aún no ha escrito su bio."}
                    </p>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/perfil/${encodeURIComponent(u.username)}`)}
                        className="flex-1 font-display text-[10px] tracking-widest border-accent/40 text-accent hover:bg-accent/10"
                      >
                        VER PERFIL
                      </Button>
                      {currentUser && !isMe && (
                        <Button
                          size="sm"
                          onClick={() =>
                            navigate(`/mensajes/${encodeURIComponent(u.username)}`)
                          }
                          className="flex-1 font-display text-[10px] tracking-widest bg-gradient-neon text-background hover:opacity-90"
                        >
                          <Mail size={12} className="mr-1" /> DM
                        </Button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Usuarios;
