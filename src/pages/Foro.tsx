import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { CreateForumPostModal } from "@/components/CreateForumPostModal";
import { ForumPostDetailModal } from "@/components/ForumPostDetailModal";
import {
  FORUM_CATEGORIES,
  categoryLabel,
  type ForumCategoryId,
} from "@/data/forumMeta";
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Plus,
  Loader2,
  Trash2,
} from "lucide-react";

export interface ForumPostRow {
  id: string;
  user_id: string;
  category: ForumCategoryId;
  title: string;
  content: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  author?: { username: string; role: string } | null;
}

const Foro = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<ForumPostRow[]>([]);
  const [activeCat, setActiveCat] = useState<ForumCategoryId | "all">("all");
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [activePost, setActivePost] = useState<ForumPostRow | null>(null);

  const isStaff =
    profile?.role?.toLowerCase() === "admin" ||
    profile?.role?.toLowerCase() === "mod";

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from("forum_posts")
      .select("*")
      .order("created_at", { ascending: false });
    if (activeCat !== "all") q = q.eq("category", activeCat);

    const { data } = await q;
    const rows = (data ?? []) as ForumPostRow[];

    if (rows.length > 0) {
      const ids = Array.from(new Set(rows.map((r) => r.user_id)));
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, username, role")
        .in("user_id", ids);
      const map = new Map(
        (profs ?? []).map((p) => [p.user_id, { username: p.username, role: p.role }])
      );
      rows.forEach((r) => (r.author = map.get(r.user_id) ?? null));
    }
    setPosts(rows);
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCat]);

  // Realtime: refresh list on new/deleted posts in current view
  useEffect(() => {
    const channel = supabase
      .channel("forum_posts_live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "forum_posts" },
        () => void load()
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCat]);

  const handleCreate = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setCreateOpen(true);
  };

  const handleDelete = async (e: React.MouseEvent, p: ForumPostRow) => {
    e.stopPropagation();
    if (!confirm("¿Borrar este post?")) return;
    const { error } = await supabase.from("forum_posts").delete().eq("id", p.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Post borrado" });
    void load();
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "ahora";
    if (mins < 60) return `hace ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `hace ${hours} h`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `hace ${days} d`;
    return new Date(iso).toLocaleDateString("es-ES");
  };

  const roleColor = (role?: string) => {
    const r = role?.toLowerCase();
    if (r === "admin" || r === "mod") return "text-accent";
    if (r === "youtuber") return "text-primary";
    return "neon-text-gold";
  };

  return (
    <div className="min-h-screen bg-background relative">
      <div className="grid-bg fixed inset-0 pointer-events-none opacity-60" />
      <Navbar active="" onNavigate={() => navigate("/")} />

      <main className="relative pt-24 pb-20">
        <div className="container max-w-5xl">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 text-foreground/60 hover:text-primary transition-colors mb-4 font-display tracking-widest text-xs"
          >
            <ArrowLeft size={14} /> VOLVER
          </button>

          <div className="text-center mb-8">
            <p className="font-display text-xs tracking-[0.4em] text-accent mb-2">
              ◆ COMUNIDAD ◆
            </p>
            <h1 className="font-display text-4xl md:text-5xl tracking-wider neon-text-gold mb-3">
              FORO
            </h1>
            <p className="text-foreground/70 max-w-xl mx-auto mb-5 text-sm">
              Comparte estrategias, anuncia eventos y discute con la élite.
            </p>
            <Button
              onClick={handleCreate}
              className="font-display tracking-[0.3em] bg-gradient-neon text-background hover:opacity-90 shadow-[0_0_20px_hsl(var(--primary)/0.4)]"
            >
              <Plus size={16} className="mr-2" /> NUEVO POST
            </Button>
          </div>

          {/* Category filter */}
          <div className="flex gap-2 flex-wrap justify-center mb-8">
            <button
              onClick={() => setActiveCat("all")}
              className={`px-4 py-1.5 rounded-md font-display text-xs tracking-widest border transition-all ${
                activeCat === "all"
                  ? "bg-primary text-primary-foreground border-primary shadow-[0_0_15px_hsl(var(--primary)/0.4)]"
                  : "bg-card/40 text-foreground/60 border-border hover:border-primary/50"
              }`}
            >
              TODO
            </button>
            {FORUM_CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCat(c.id)}
                className={`px-4 py-1.5 rounded-md font-display text-xs tracking-widest border transition-all ${
                  activeCat === c.id
                    ? "bg-primary text-primary-foreground border-primary shadow-[0_0_15px_hsl(var(--primary)/0.4)]"
                    : "bg-card/40 text-foreground/60 border-border hover:border-primary/50"
                }`}
              >
                {c.label.toUpperCase()}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 size={28} className="animate-spin text-primary" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16 text-foreground/60 font-display tracking-wider">
              Aún no hay posts en esta categoría. ¡Sé el primero!
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((p) => {
                const own = user?.id === p.user_id;
                const canDelete = own || isStaff;
                return (
                  <article
                    key={p.id}
                    onClick={() => setActivePost(p)}
                    className="glass-strong rounded-lg p-4 md:p-5 cursor-pointer hover:border-accent/60 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display text-[10px] tracking-widest px-2 py-0.5 rounded border border-accent/40 text-accent bg-accent/10">
                          {categoryLabel(p.category).toUpperCase()}
                        </span>
                        <span className="text-[10px] text-foreground/40 font-display tracking-wider">
                          {timeAgo(p.created_at)}
                        </span>
                      </div>
                      {canDelete && (
                        <button
                          onClick={(e) => handleDelete(e, p)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive/80"
                          aria-label="Borrar post"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    <h3 className="font-display text-lg md:text-xl tracking-wide text-foreground mb-1.5 line-clamp-2">
                      {p.title}
                    </h3>

                    <p className="text-sm text-foreground/70 line-clamp-2 mb-3">
                      {p.content}
                    </p>

                    <div className="flex items-center gap-4 text-xs">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (p.author?.username)
                            navigate(`/perfil/${p.author.username}`);
                        }}
                        className={`font-display tracking-widest ${roleColor(
                          p.author?.role
                        )} hover:underline`}
                      >
                        {p.author?.username ?? "Trainer"}
                      </button>
                      <span className="flex items-center gap-1 text-foreground/60">
                        <Heart size={12} /> {p.likes_count}
                      </span>
                      <span className="flex items-center gap-1 text-foreground/60">
                        <MessageCircle size={12} /> {p.comments_count}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />

      <CreateForumPostModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultCategory={activeCat === "all" ? "estrategia" : activeCat}
        onCreated={load}
      />

      <ForumPostDetailModal
        post={activePost}
        open={!!activePost}
        onOpenChange={(o) => !o && setActivePost(null)}
        onChanged={load}
      />
    </div>
  );
};

export default Foro;
