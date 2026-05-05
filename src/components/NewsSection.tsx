import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Pin, Plus, Pencil, Trash2, Megaphone, ChevronLeft, ChevronRight } from "lucide-react";
import { CreateNewsModal } from "./CreateNewsModal";
import { NewsDetailModal } from "./NewsDetailModal";
import { useToast } from "@/hooks/use-toast";

interface NewsItem {
  id: string;
  user_id: string;
  title: string;
  summary: string;
  content: string;
  image_url: string | null;
  pinned: boolean;
  published: boolean;
  created_at: string;
  author_username?: string | null;
  author_role?: string | null;
}

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return `[${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}]`;
};

export const NewsSection = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<NewsItem | null>(null);
  const [detail, setDetail] = useState<NewsItem | null>(null);

  const isStaff = profile?.role === "admin" || profile?.role === "mod";

  const load = async () => {
    const { data: news } = await supabase
      .from("news")
      .select("*")
      .eq("published", true)
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(20);

    if (!news || news.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }
    const userIds = Array.from(new Set(news.map((n) => n.user_id)));
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, username, role")
      .in("user_id", userIds);
    const map = new Map(profiles?.map((p) => [p.user_id, p]) ?? []);
    setItems(
      news.map((n) => ({
        ...n,
        author_username: map.get(n.user_id)?.username ?? null,
        author_role: map.get(n.user_id)?.role ?? null,
      })),
    );
    setLoading(false);
  };

  useEffect(() => {
    void load();
    const ch = supabase
      .channel("news-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "news" }, () => void load())
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta noticia?")) return;
    const { error } = await supabase.from("news").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Noticia eliminada" });
  };

  const scroll = (dir: 1 | -1) => {
    const el = document.getElementById("news-scroller");
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  const showSection = useMemo(() => isStaff || items.length > 0, [isStaff, items.length]);
  if (!showSection && !loading) return null;

  return (
    <section className="relative py-8 md:py-10 border-y border-primary/15 bg-gradient-to-b from-background via-background/95 to-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Megaphone size={18} className="text-primary shrink-0" />
            <h2 className="font-display text-lg md:text-xl tracking-[0.3em] neon-text-gold truncate">
              NOTICIAS
            </h2>
            <span className="text-[10px] font-display tracking-widest text-foreground/40 hidden sm:inline">
              · STAFF MATAGOD
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {items.length > 1 && (
              <>
                <button
                  onClick={() => scroll(-1)}
                  className="hidden md:flex h-8 w-8 items-center justify-center rounded-md border border-primary/30 text-foreground/70 hover:text-primary hover:border-primary/60 transition-colors"
                  aria-label="Anterior"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => scroll(1)}
                  className="hidden md:flex h-8 w-8 items-center justify-center rounded-md border border-primary/30 text-foreground/70 hover:text-primary hover:border-primary/60 transition-colors"
                  aria-label="Siguiente"
                >
                  <ChevronRight size={16} />
                </button>
              </>
            )}
            {isStaff && (
              <button
                onClick={() => {
                  setEditing(null);
                  setCreateOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 h-8 rounded-md bg-primary text-primary-foreground font-display text-[11px] tracking-widest hover:opacity-90 shadow-[0_0_12px_hsl(var(--primary)/0.4)]"
              >
                <Plus size={14} /> NUEVA
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex gap-3 overflow-hidden">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-32 w-72 shrink-0 rounded-lg bg-card/40 border border-border animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-primary/30 bg-card/30 p-6 text-center">
            <p className="font-display text-sm tracking-wider text-foreground/60">
              SIN NOTICIAS POR AHORA
            </p>
            {isStaff && (
              <p className="text-xs text-foreground/40 mt-1">
                Como staff, puedes publicar la primera con el botón "NUEVA".
              </p>
            )}
          </div>
        ) : (
          <div
            id="news-scroller"
            className="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 -mx-4 px-4 [scrollbar-width:thin]"
          >
            {items.map((n) => (
              <article
                key={n.id}
                className="snap-start shrink-0 w-[85%] sm:w-[360px] md:w-[400px] group relative"
              >
                <button
                  type="button"
                  onClick={() => setDetail(n)}
                  className="text-left w-full h-full rounded-lg border border-primary/25 bg-card/60 hover:bg-card/80 hover:border-primary/60 transition-all overflow-hidden flex flex-col shadow-[0_0_0_hsl(var(--primary)/0)] hover:shadow-[0_0_20px_hsl(var(--primary)/0.25)]"
                >
                  {n.image_url && (
                    <div className="relative h-28 w-full overflow-hidden">
                      <img
                        src={n.image_url}
                        alt={n.title}
                        className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-card/95 to-transparent" />
                    </div>
                  )}
                  <div className="p-4 flex-1 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-[10px] font-display tracking-widest text-foreground/45">
                      {n.pinned && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/40">
                          <Pin size={9} /> DESTACADA
                        </span>
                      )}
                      <span>{formatDate(n.created_at)}</span>
                      {n.author_username && (
                        <span className="truncate text-foreground/40">· {n.author_username}</span>
                      )}
                    </div>
                    <h3 className="font-display text-base tracking-wide text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                      {n.title}
                    </h3>
                    <p className="text-xs text-foreground/65 line-clamp-2">{n.summary}</p>
                  </div>
                </button>

                {isStaff && (
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditing(n);
                        setCreateOpen(true);
                      }}
                      className="h-7 w-7 inline-flex items-center justify-center rounded-md bg-background/80 backdrop-blur border border-primary/40 text-foreground/80 hover:text-primary"
                      aria-label="Editar"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleDelete(n.id);
                      }}
                      className="h-7 w-7 inline-flex items-center justify-center rounded-md bg-background/80 backdrop-blur border border-destructive/40 text-destructive/80 hover:text-destructive"
                      aria-label="Eliminar"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>

      <CreateNewsModal
        open={createOpen}
        onOpenChange={(o) => {
          setCreateOpen(o);
          if (!o) setEditing(null);
        }}
        editing={editing}
        onSaved={load}
      />
      <NewsDetailModal open={!!detail} onOpenChange={(o) => !o && setDetail(null)} item={detail} />
    </section>
  );
};
