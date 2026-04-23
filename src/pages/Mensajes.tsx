import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ArrowLeft, Loader2, MessageSquare, User as UserIcon } from "lucide-react";

interface ConversationPreview {
  user_id: string;
  username: string;
  avatar_url: string | null;
  role: string;
  last_message: string;
  last_at: string;
  unread: number;
}

const Mensajes = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }

    const load = async () => {
      setLoading(true);
      const { data: msgs } = await supabase
        .from("direct_messages")
        .select("*")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false })
        .limit(500);

      const groups = new Map<
        string,
        { last_message: string; last_at: string; unread: number }
      >();

      (msgs ?? []).forEach((m) => {
        const otherId = m.sender_id === user.id ? m.receiver_id : m.sender_id;
        const existing = groups.get(otherId);
        if (!existing) {
          groups.set(otherId, {
            last_message: m.content,
            last_at: m.created_at,
            unread:
              m.receiver_id === user.id && !m.read_at ? 1 : 0,
          });
        } else if (m.receiver_id === user.id && !m.read_at) {
          existing.unread += 1;
        }
      });

      const otherIds = Array.from(groups.keys());
      if (otherIds.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, username, avatar_url, role")
        .in("user_id", otherIds);

      const list: ConversationPreview[] = (profs ?? []).map((p) => {
        const g = groups.get(p.user_id)!;
        return {
          user_id: p.user_id,
          username: p.username,
          avatar_url: p.avatar_url,
          role: p.role,
          last_message: g.last_message,
          last_at: g.last_at,
          unread: g.unread,
        };
      });
      list.sort((a, b) => (a.last_at < b.last_at ? 1 : -1));
      setConversations(list);
      setLoading(false);
    };

    void load();

    // Realtime: refresh on new messages involving me
    const channel = supabase
      .channel("dm_inbox")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "direct_messages" },
        () => void load()
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, authLoading, navigate]);

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      const today = new Date();
      const sameDay = d.toDateString() === today.toDateString();
      return sameDay
        ? d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
        : d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" });
    } catch {
      return "";
    }
  };

  return (
    <div className="min-h-screen bg-background relative flex flex-col">
      <div className="grid-bg fixed inset-0 pointer-events-none opacity-60" />
      <Navbar active="" onNavigate={() => navigate("/")} />

      <main className="relative pt-24 pb-12 flex-1">
        <div className="container max-w-3xl">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 text-foreground/60 hover:text-primary transition-colors mb-4 font-display tracking-widest text-xs"
          >
            <ArrowLeft size={14} /> VOLVER
          </button>

          <div className="text-center mb-6">
            <p className="font-display text-xs tracking-[0.4em] text-accent mb-1">
              ◆ BANDEJA ◆
            </p>
            <h1 className="font-display text-3xl md:text-4xl tracking-wider neon-text-red">
              MENSAJES PRIVADOS
            </h1>
          </div>

          <div className="neon-border bg-card/80 backdrop-blur-xl rounded-lg overflow-hidden">
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 size={28} className="animate-spin text-primary" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-16 px-6">
                <MessageSquare
                  size={36}
                  className="mx-auto text-foreground/30 mb-3"
                />
                <p className="text-foreground/60 text-sm">
                  Aún no tienes conversaciones. Visita el perfil de un trainer
                  y envíale un mensaje.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {conversations.map((c) => (
                  <li key={c.user_id}>
                    <Link
                      to={`/mensajes/${encodeURIComponent(c.username)}`}
                      className="flex items-center gap-3 p-4 hover:bg-primary/5 transition-colors"
                    >
                      <div className="h-12 w-12 rounded-full bg-gradient-neon overflow-hidden shrink-0 flex items-center justify-center">
                        {c.avatar_url ? (
                          <img
                            src={c.avatar_url}
                            alt={c.username}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <UserIcon size={20} className="text-background" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-display text-sm tracking-wider neon-text-gold truncate">
                            {c.username}
                          </span>
                          <span className="text-[10px] text-foreground/40 shrink-0">
                            {formatDate(c.last_at)}
                          </span>
                        </div>
                        <p className="text-xs text-foreground/60 truncate mt-0.5">
                          {c.last_message}
                        </p>
                      </div>
                      {c.unread > 0 && (
                        <span className="bg-primary text-primary-foreground text-[10px] font-display font-bold px-2 py-0.5 rounded-full shadow-[0_0_10px_hsl(var(--primary))]">
                          {c.unread}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Mensajes;
