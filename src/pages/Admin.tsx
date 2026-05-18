import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Ban,
  Loader2,
  Shield,
  ShieldCheck,
  Trash2,
  UserCheck,
} from "lucide-react";

type ProfileRow = {
  user_id: string;
  username: string;
  role: string;
  avatar_url: string | null;
  created_at: string;
  banned?: boolean;
};

type Tab = "users" | "bans" | "builds" | "forum" | "tournaments" | "chat";

const TABS: { id: Tab; label: string }[] = [
  { id: "users", label: "USUARIOS" },
  { id: "bans", label: "BANEOS" },
  { id: "builds", label: "BUILDS" },
  { id: "forum", label: "FORO" },
  { id: "tournaments", label: "TORNEOS" },
  { id: "chat", label: "CHAT" },
];

const Admin = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const role = profile?.role?.toLowerCase();
  const isAdmin = role === "admin";
  const isStaff = isAdmin || role === "mod";

  const [tab, setTab] = useState<Tab>("users");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [bans, setBans] = useState<
    { user_id: string; reason: string | null; created_at: string; username?: string }[]
  >([]);
  const [builds, setBuilds] = useState<
    { id: string; name: string; tier: string; user_id: string; username?: string; created_at: string }[]
  >([]);
  const [posts, setPosts] = useState<
    { id: string; title: string; user_id: string; username?: string; created_at: string }[]
  >([]);
  const [tournaments, setTournaments] = useState<
    { id: string; name: string; user_id: string; username?: string; event_date: string }[]
  >([]);
  const [chat, setChat] = useState<
    { id: string; message: string; user_id: string; username?: string; created_at: string }[]
  >([]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    if (!isStaff) {
      navigate("/");
    }
  }, [authLoading, user, isStaff, navigate]);

  const attachUsernames = async <T extends { user_id: string }>(rows: T[]): Promise<(T & { username?: string })[]> => {
    if (rows.length === 0) return [];
    const ids = Array.from(new Set(rows.map((r) => r.user_id)));
    const { data: profs } = await supabase
      .from("profiles")
      .select("user_id, username")
      .in("user_id", ids);
    const map = new Map((profs ?? []).map((p) => [p.user_id, p.username]));
    return rows.map((r) => ({ ...r, username: map.get(r.user_id) }));
  };

  const loadUsers = async () => {
    setLoading(true);
    const { data: profs } = await supabase
      .from("profiles")
      .select("user_id, username, role, avatar_url, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    const { data: banRows } = await supabase.from("banned_users").select("user_id");
    const banSet = new Set((banRows ?? []).map((b) => b.user_id));
    setUsers((profs ?? []).map((p) => ({ ...p, banned: banSet.has(p.user_id) })));
    setLoading(false);
  };

  const loadBans = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("banned_users")
      .select("user_id, reason, created_at")
      .order("created_at", { ascending: false });
    const withNames = await attachUsernames(data ?? []);
    setBans(withNames);
    setLoading(false);
  };

  const loadBuilds = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("builds")
      .select("id, name, tier, user_id, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    setBuilds(await attachUsernames(data ?? []));
    setLoading(false);
  };

  const loadPosts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("forum_posts")
      .select("id, title, user_id, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    setPosts(await attachUsernames(data ?? []));
    setLoading(false);
  };

  const loadTournaments = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("tournaments")
      .select("id, name, user_id, event_date")
      .order("event_date", { ascending: false })
      .limit(200);
    setTournaments(await attachUsernames(data ?? []));
    setLoading(false);
  };

  const loadChat = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("chat_messages")
      .select("id, message, user_id, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    setChat(await attachUsernames(data ?? []));
    setLoading(false);
  };

  useEffect(() => {
    if (!isStaff) return;
    if (tab === "users") void loadUsers();
    else if (tab === "bans") void loadBans();
    else if (tab === "builds") void loadBuilds();
    else if (tab === "forum") void loadPosts();
    else if (tab === "tournaments") void loadTournaments();
    else if (tab === "chat") void loadChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, isStaff]);

  const banUser = async (target: ProfileRow) => {
    const reason = prompt(`Motivo del baneo a "${target.username}":`, "") ?? "";
    const { error } = await supabase.from("banned_users").insert({
      user_id: target.user_id,
      banned_by: user!.id,
      reason: reason || null,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Usuario baneado", description: target.username });
    void loadUsers();
  };

  const unbanUser = async (userId: string) => {
    if (!isAdmin) {
      toast({ title: "Solo admin puede desbanear", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("banned_users").delete().eq("user_id", userId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Usuario desbaneado" });
    void (tab === "bans" ? loadBans() : loadUsers());
  };

  const changeRole = async (target: ProfileRow, newRole: string) => {
    if (!isAdmin) return;
    const { error } = await supabase.rpc("set_user_role", {
      _user_id: target.user_id,
      _role: newRole,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Rol actualizado", description: `${target.username} → ${newRole}` });
    void loadUsers();
  };

  const deleteRow = async (
    table: "builds" | "forum_posts" | "tournaments" | "chat_messages",
    id: string,
    label: string
  ) => {
    if (!confirm(`¿Borrar ${label}? Esta acción es irreversible.`)) return;
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Eliminado" });
    if (table === "builds") void loadBuilds();
    if (table === "forum_posts") void loadPosts();
    if (table === "tournaments") void loadTournaments();
    if (table === "chat_messages") void loadChat();
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return { users, bans, builds, posts, tournaments, chat };
    return {
      users: users.filter((u) => u.username.toLowerCase().includes(q)),
      bans: bans.filter((b) => (b.username ?? "").toLowerCase().includes(q)),
      builds: builds.filter(
        (b) => b.name.toLowerCase().includes(q) || (b.username ?? "").toLowerCase().includes(q)
      ),
      posts: posts.filter(
        (p) => p.title.toLowerCase().includes(q) || (p.username ?? "").toLowerCase().includes(q)
      ),
      tournaments: tournaments.filter(
        (t) => t.name.toLowerCase().includes(q) || (t.username ?? "").toLowerCase().includes(q)
      ),
      chat: chat.filter(
        (c) => c.message.toLowerCase().includes(q) || (c.username ?? "").toLowerCase().includes(q)
      ),
    };
  }, [search, users, bans, builds, posts, tournaments, chat]);

  if (authLoading || !user || !isStaff) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      <div className="grid-bg fixed inset-0 pointer-events-none opacity-60" />
      <Navbar active="" onNavigate={() => navigate("/")} />

      <main className="relative pt-24 pb-20">
        <div className="container max-w-6xl">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 text-foreground/60 hover:text-primary transition-colors mb-4 font-display tracking-widest text-xs"
          >
            <ArrowLeft size={14} /> VOLVER
          </button>

          <div className="flex items-center gap-3 mb-2">
            <Shield className="text-accent" />
            <p className="font-display text-xs tracking-[0.4em] text-accent">
              ◆ PANEL DE CONTROL ◆
            </p>
          </div>
          <h1 className="font-display text-3xl md:text-5xl tracking-wider neon-text-gold mb-2">
            ADMINISTRACIÓN
          </h1>
          <p className="text-foreground/70 text-sm mb-6">
            Sesión activa como{" "}
            <span className="text-accent font-display tracking-widest">
              {profile?.username}
            </span>{" "}
            ({isAdmin ? "ADMIN" : "MOD"})
          </p>

          {/* Tabs */}
          <div className="flex gap-2 flex-wrap mb-4">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-1.5 rounded-md font-display text-xs tracking-widest border transition-all ${
                  tab === t.id
                    ? "bg-primary text-primary-foreground border-primary shadow-[0_0_15px_hsl(var(--primary)/0.4)]"
                    : "bg-card/40 text-foreground/60 border-border hover:border-primary/50"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <Input
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-4 max-w-sm bg-card/40"
          />

          <div className="glass-strong rounded-lg p-3 md:p-4 overflow-x-auto">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-primary" />
              </div>
            ) : tab === "users" ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.users.map((u) => (
                    <TableRow key={u.user_id}>
                      <TableCell className="font-display tracking-widest text-accent">
                        {u.username}
                      </TableCell>
                      <TableCell className="uppercase text-xs">{u.role}</TableCell>
                      <TableCell>
                        {u.banned ? (
                          <span className="text-destructive font-display text-[10px] tracking-widest">
                            BANEADO
                          </span>
                        ) : (
                          <span className="text-primary font-display text-[10px] tracking-widest">
                            ACTIVO
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end flex-wrap">
                          {isAdmin && (
                            <>
                              {u.role !== "mod" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => changeRole(u, "mod")}
                                >
                                  <ShieldCheck size={12} className="mr-1" /> Hacer MOD
                                </Button>
                              )}
                              {u.role !== "user" && u.user_id !== user!.id && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => changeRole(u, "user")}
                                >
                                  <UserCheck size={12} className="mr-1" /> Quitar rol
                                </Button>
                              )}
                            </>
                          )}
                          {u.user_id !== user!.id &&
                            (u.banned ? (
                              isAdmin && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => unbanUser(u.user_id)}
                                >
                                  Desbanear
                                </Button>
                              )
                            ) : (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => banUser(u)}
                              >
                                <Ban size={12} className="mr-1" /> Banear
                              </Button>
                            ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : tab === "bans" ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.bans.map((b) => (
                    <TableRow key={b.user_id}>
                      <TableCell className="text-accent font-display tracking-widest">
                        {b.username ?? b.user_id.slice(0, 8)}
                      </TableCell>
                      <TableCell className="text-foreground/70 text-sm">
                        {b.reason ?? "—"}
                      </TableCell>
                      <TableCell className="text-foreground/60 text-xs">
                        {new Date(b.created_at).toLocaleString("es-ES")}
                      </TableCell>
                      <TableCell className="text-right">
                        {isAdmin && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => unbanUser(b.user_id)}
                          >
                            Desbanear
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : tab === "builds" ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Autor</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.builds.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell>{b.name}</TableCell>
                      <TableCell className="uppercase text-xs">{b.tier}</TableCell>
                      <TableCell className="text-accent font-display text-xs tracking-widest">
                        {b.username ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteRow("builds", b.id, `build "${b.name}"`)}
                        >
                          <Trash2 size={12} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : tab === "forum" ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Autor</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.posts.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="max-w-xs truncate">{p.title}</TableCell>
                      <TableCell className="text-accent font-display text-xs tracking-widest">
                        {p.username ?? "—"}
                      </TableCell>
                      <TableCell className="text-foreground/60 text-xs">
                        {new Date(p.created_at).toLocaleDateString("es-ES")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteRow("forum_posts", p.id, `post "${p.title}"`)}
                        >
                          <Trash2 size={12} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : tab === "tournaments" ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Organizador</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.tournaments.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>{t.name}</TableCell>
                      <TableCell className="text-foreground/60 text-xs">
                        {new Date(t.event_date).toLocaleDateString("es-ES")}
                      </TableCell>
                      <TableCell className="text-accent font-display text-xs tracking-widest">
                        {t.username ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteRow("tournaments", t.id, `torneo "${t.name}"`)}
                        >
                          <Trash2 size={12} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mensaje</TableHead>
                    <TableHead>Autor</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.chat.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="max-w-md truncate">{c.message}</TableCell>
                      <TableCell className="text-accent font-display text-xs tracking-widest">
                        {c.username ?? "—"}
                      </TableCell>
                      <TableCell className="text-foreground/60 text-xs">
                        {new Date(c.created_at).toLocaleString("es-ES")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteRow("chat_messages", c.id, "mensaje")}
                        >
                          <Trash2 size={12} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Admin;
