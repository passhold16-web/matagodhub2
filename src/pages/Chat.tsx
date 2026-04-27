import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, Trash2, ArrowLeft, ShieldCheck, Eraser } from "lucide-react";
import { UsernameLink } from "@/components/UsernameLink";

interface ChatMessage {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  author?: { username: string; role: string; avatar_url: string | null } | null;
}

const MAX_LEN = 300;
const COOLDOWN_MS = 2000;

const Chat = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const lastSentRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isStaff =
    profile?.role?.toLowerCase() === "admin" ||
    profile?.role?.toLowerCase() === "mod";

  const enrichAuthors = async (rows: ChatMessage[]): Promise<ChatMessage[]> => {
    if (rows.length === 0) return rows;
    const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
    const { data: profs } = await supabase
      .from("profiles")
      .select("user_id, username, role, avatar_url")
      .in("user_id", userIds);
    const map = new Map(
      (profs ?? []).map((p) => [
        p.user_id,
        { username: p.username, role: p.role, avatar_url: p.avatar_url },
      ])
    );
    return rows.map((r) => ({ ...r, author: map.get(r.user_id) ?? null }));
  };

  // Initial load
  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(200);
      const enriched = await enrichAuthors((data ?? []) as ChatMessage[]);
      if (active) {
        setMessages(enriched);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("chat_messages_live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        async (payload) => {
          const incoming = payload.new as ChatMessage;
          const [enriched] = await enrichAuthors([incoming]);
          setMessages((prev) =>
            prev.some((m) => m.id === enriched.id) ? prev : [...prev, enriched]
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "chat_messages" },
        (payload) => {
          const removed = payload.old as { id: string };
          setMessages((prev) => prev.filter((m) => m.id !== removed.id));
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const send = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }
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
    if (now - lastSentRef.current < COOLDOWN_MS) {
      toast({
        title: "Espera un momento",
        description: "No spam. Hay un margen de 2 segundos entre mensajes.",
      });
      return;
    }

    setSending(true);
    lastSentRef.current = now;
    const { error } = await supabase
      .from("chat_messages")
      .insert({ user_id: user.id, message: trimmed });
    setSending(false);

    if (error) {
      lastSentRef.current = 0;
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setText("");
  };

  const handleDelete = async (m: ChatMessage) => {
    const { error } = await supabase
      .from("chat_messages")
      .delete()
      .eq("id", m.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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

  const roleColor = (role?: string) => {
    const r = role?.toLowerCase();
    if (r === "admin") return "text-accent";
    if (r === "youtuber") return "text-primary";
    if (r === "mod") return "text-accent";
    return "neon-text-gold";
  };

  return (
    <div className="min-h-screen bg-background relative flex flex-col">
      <div className="grid-bg fixed inset-0 pointer-events-none opacity-60" />
      <Navbar active="" onNavigate={() => navigate("/")} />

      <main className="relative pt-24 pb-6 flex-1 flex flex-col">
        <div className="container max-w-3xl flex-1 flex flex-col">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 text-foreground/60 hover:text-primary transition-colors mb-4 font-display tracking-widest text-xs self-start"
          >
            <ArrowLeft size={14} /> VOLVER
          </button>

          <div className="text-center mb-4">
            <p className="font-display text-xs tracking-[0.4em] text-accent mb-1">
              ◆ EN VIVO ◆
            </p>
            <h1 className="font-display text-3xl md:text-4xl tracking-wider neon-text-red">
              CHAT GLOBAL
            </h1>
          </div>

          <div className="neon-border bg-card/80 backdrop-blur-xl rounded-lg flex-1 flex flex-col overflow-hidden min-h-[60vh]">
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-3"
            >
              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 size={24} className="animate-spin text-primary" />
                </div>
              ) : messages.length === 0 ? (
                <p className="text-center text-foreground/50 text-sm py-10">
                  Aún no hay mensajes. Sé el primero en romper el silencio.
                </p>
              ) : (
                messages.map((m) => {
                  const own = user?.id === m.user_id;
                  const canDelete = own || isStaff;
                  return (
                    <div
                      key={m.id}
                      className={`group flex gap-2 ${own ? "justify-end" : ""}`}
                    >
                      {!own && (
                        <UsernameLink
                          username={m.author?.username}
                          stopPropagation={false}
                          className="h-8 w-8 rounded-full bg-gradient-neon shrink-0 overflow-hidden block"
                          ariaLabel="Ver perfil"
                        >
                          {m.author?.avatar_url ? (
                            <img
                              src={m.author.avatar_url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : null}
                        </UsernameLink>
                      )}
                      <div
                        className={`max-w-[78%] rounded-lg px-3 py-2 ${
                          own
                            ? "bg-primary/15 border border-primary/40"
                            : "bg-card/60 border border-border"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <UsernameLink
                            username={m.author?.username}
                            className={`font-display text-[11px] tracking-widest ${roleColor(
                              m.author?.role
                            )}`}
                          >
                            {m.author?.username ?? "Trainer"}
                          </UsernameLink>
                          {m.author?.role &&
                            m.author.role.toLowerCase() !== "user" && (
                              <ShieldCheck
                                size={10}
                                className={roleColor(m.author.role)}
                              />
                            )}
                          <span className="text-[10px] text-foreground/40 ml-auto">
                            {formatTime(m.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">
                          {m.message}
                        </p>
                      </div>
                      {canDelete && (
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
              {!authLoading && !user ? (
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-foreground/60">
                    Inicia sesión para participar.
                  </p>
                  <Button
                    size="sm"
                    onClick={() => navigate("/auth")}
                    className="font-display tracking-widest bg-gradient-neon text-background"
                  >
                    INICIAR SESIÓN
                  </Button>
                </div>
              ) : (
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Input
                      value={text}
                      onChange={(e) => setText(e.target.value.slice(0, MAX_LEN))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          void send();
                        }
                      }}
                      placeholder="Escribe un mensaje..."
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
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Chat;
