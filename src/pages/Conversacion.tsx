import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Loader2,
  Send,
  Trash2,
  User as UserIcon,
} from "lucide-react";

interface DM {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

interface OtherProfile {
  user_id: string;
  username: string;
  avatar_url: string | null;
  role: string;
}

const MAX_LEN = 500;
const COOLDOWN_MS = 1000;

const Conversacion = () => {
  const { username } = useParams<{ username: string }>();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [other, setOther] = useState<OtherProfile | null>(null);
  const [messages, setMessages] = useState<DM[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const lastSentRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load other user + initial messages
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    if (!username) return;

    let active = true;
    const load = async () => {
      setLoading(true);
      const { data: prof } = await supabase
        .from("profiles")
        .select("user_id, username, avatar_url, role")
        .ilike("username", username)
        .limit(1)
        .maybeSingle();

      if (!prof) {
        if (active) {
          setNotFound(true);
          setLoading(false);
        }
        return;
      }

      if (prof.user_id === user.id) {
        // Can't DM yourself
        if (active) {
          toast({
            title: "No puedes enviarte mensajes a ti mismo",
            variant: "destructive",
          });
          navigate("/mensajes");
        }
        return;
      }

      if (active) setOther(prof as OtherProfile);

      const { data: msgs } = await supabase
        .from("direct_messages")
        .select("*")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${prof.user_id}),and(sender_id.eq.${prof.user_id},receiver_id.eq.${user.id})`
        )
        .order("created_at", { ascending: true })
        .limit(500);

      if (active) {
        setMessages((msgs ?? []) as DM[]);
        setLoading(false);
      }

      // Mark received as read
      const unreadIds = (msgs ?? [])
        .filter((m) => m.receiver_id === user.id && !m.read_at)
        .map((m) => m.id);
      if (unreadIds.length > 0) {
        await supabase
          .from("direct_messages")
          .update({ read_at: new Date().toISOString() })
          .in("id", unreadIds);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [username, user, authLoading, navigate, toast]);

  // Realtime
  useEffect(() => {
    if (!user || !other) return;
    const channel = supabase
      .channel(`dm_${user.id}_${other.user_id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "direct_messages" },
        async (payload) => {
          const m = payload.new as DM;
          const involves =
            (m.sender_id === user.id && m.receiver_id === other.user_id) ||
            (m.sender_id === other.user_id && m.receiver_id === user.id);
          if (!involves) return;
          setMessages((prev) =>
            prev.some((p) => p.id === m.id) ? prev : [...prev, m]
          );
          if (m.receiver_id === user.id && !m.read_at) {
            await supabase
              .from("direct_messages")
              .update({ read_at: new Date().toISOString() })
              .eq("id", m.id);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "direct_messages" },
        (payload) => {
          const removed = payload.old as { id: string };
          setMessages((prev) => prev.filter((m) => m.id !== removed.id));
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, other]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const send = async () => {
    if (!user || !other) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    if (trimmed.length > MAX_LEN) {
      toast({
        title: "Mensaje demasiado largo",
        description: `Máximo ${MAX_LEN} caracteres.`,
        variant: "destructive",
      });
      return;
    }
    const now = Date.now();
    if (now - lastSentRef.current < COOLDOWN_MS) return;

    setSending(true);
    lastSentRef.current = now;
    const { error } = await supabase.from("direct_messages").insert({
      sender_id: user.id,
      receiver_id: other.user_id,
      content: trimmed,
    });
    setSending(false);

    if (error) {
      lastSentRef.current = 0;
      toast({
        title: "Error al enviar",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    setText("");
  };

  const handleDelete = async (m: DM) => {
    const { error } = await supabase
      .from("direct_messages")
      .delete()
      .eq("id", m.id);
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="min-h-screen bg-background relative flex flex-col">
      <div className="grid-bg fixed inset-0 pointer-events-none opacity-60" />
      <Navbar active="" onNavigate={() => navigate("/")} />

      <main className="relative pt-24 pb-6 flex-1 flex flex-col">
        <div className="container max-w-3xl flex-1 flex flex-col">
          <button
            onClick={() => navigate("/mensajes")}
            className="inline-flex items-center gap-2 text-foreground/60 hover:text-primary transition-colors mb-4 font-display tracking-widest text-xs self-start"
          >
            <ArrowLeft size={14} /> BANDEJA
          </button>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 size={28} className="animate-spin text-primary" />
            </div>
          ) : notFound || !other ? (
            <div className="text-center py-16">
              <p className="text-foreground/60">Trainer no encontrado.</p>
            </div>
          ) : (
            <div className="neon-border bg-card/80 backdrop-blur-xl rounded-lg flex-1 flex flex-col overflow-hidden min-h-[60vh]">
              {/* Header */}
              <Link
                to={`/perfil/${encodeURIComponent(other.username)}`}
                className="flex items-center gap-3 p-3 border-b border-primary/20 hover:bg-primary/5 transition-colors"
              >
                <div className="h-10 w-10 rounded-full bg-gradient-neon overflow-hidden flex items-center justify-center shrink-0">
                  {other.avatar_url ? (
                    <img
                      src={other.avatar_url}
                      alt={other.username}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserIcon size={18} className="text-background" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-sm tracking-wider neon-text-gold truncate">
                    {other.username}
                  </p>
                  <p className="text-[10px] text-foreground/50 tracking-widest uppercase">
                    {other.role === "user" ? "Trainer" : other.role}
                  </p>
                </div>
              </Link>

              {/* Messages */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-2"
              >
                {messages.length === 0 ? (
                  <p className="text-center text-foreground/50 text-sm py-10">
                    Comienza la conversación 👋
                  </p>
                ) : (
                  messages.map((m) => {
                    const own = m.sender_id === user!.id;
                    return (
                      <div
                        key={m.id}
                        className={`group flex gap-2 ${own ? "justify-end" : ""}`}
                      >
                        <div
                          className={`max-w-[78%] rounded-lg px-3 py-2 ${
                            own
                              ? "bg-primary/15 border border-primary/40"
                              : "bg-card/60 border border-border"
                          }`}
                        >
                          <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">
                            {m.content}
                          </p>
                          <p className="text-[10px] text-foreground/40 mt-1 text-right">
                            {formatTime(m.created_at)}
                            {own && m.read_at && " ✓✓"}
                          </p>
                        </div>
                        {own && (
                          <button
                            onClick={() => handleDelete(m)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive/80 self-center"
                            aria-label="Borrar mensaje"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Composer */}
              <div className="border-t border-primary/20 p-3 bg-background/60">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Input
                      value={text}
                      onChange={(e) =>
                        setText(e.target.value.slice(0, MAX_LEN))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          void send();
                        }
                      }}
                      placeholder={`Mensaje a ${other.username}...`}
                      disabled={sending}
                      className="bg-background/60 border-primary/30 focus:border-primary"
                    />
                    <div className="text-[10px] text-foreground/40 mt-1 text-right">
                      {text.length}/{MAX_LEN}
                    </div>
                  </div>
                  <Button
                    onClick={send}
                    disabled={sending || !text.trim()}
                    className="font-display tracking-widest bg-gradient-neon text-background hover:opacity-90"
                    aria-label="Enviar mensaje"
                  >
                    {sending ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Send size={14} />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Conversacion;
