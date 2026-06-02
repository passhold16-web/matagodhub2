import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ChallengeSteps } from "@/components/challenges/ChallengeSteps";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { fetchChallengeById } from "@/lib/fetchChallenges";
import {
  buildSpectatorAnnouncement,
  canReportResult,
  TIMEZONE_OPTIONS,
} from "@/lib/challengeHelpers";
import { displayPokemmoNick } from "@/lib/combatStats";
import type { ChallengeMessageRow, ChallengeWithProfiles } from "@/types/challenges";
import { ArrowLeft, Loader2, Send } from "lucide-react";

const DesafioDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [challenge, setChallenge] = useState<ChallengeWithProfiles | null>(null);
  const [messages, setMessages] = useState<ChallengeMessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatText, setChatText] = useState("");
  const [meetDay, setMeetDay] = useState("");
  const [meetTime, setMeetTime] = useState("");
  const [meetTz, setMeetTz] = useState(TIMEZONE_OPTIONS[0]);
  const [meetChannel, setMeetChannel] = useState("");
  const [meetCity, setMeetCity] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const c = await fetchChallengeById(id);
    setChallenge(c);
    if (c?.meet_day) setMeetDay(c.meet_day);
    if (c?.meet_time) setMeetTime(String(c.meet_time).slice(0, 5));
    if (c?.meet_timezone) setMeetTz(c.meet_timezone);
    if (c?.meet_channel) setMeetChannel(c.meet_channel);
    if (c?.meet_city) setMeetCity(c.meet_city);

    const { data: msgs } = await supabase
      .from("challenge_messages")
      .select("*")
      .eq("challenge_id", id)
      .order("created_at", { ascending: true });

    if (msgs?.length) {
      const userIds = Array.from(new Set(msgs.map((m) => m.user_id)));
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, username, avatar_url")
        .in("user_id", userIds);
      const map = new Map((profs ?? []).map((p) => [p.user_id, p]));
      setMessages(
        msgs.map((m) => ({
          ...m,
          author: map.get(m.user_id)
            ? { username: map.get(m.user_id)!.username, avatar_url: map.get(m.user_id)!.avatar_url }
            : undefined,
        }))
      );
    } else {
      setMessages([]);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    void load();
    if (!id) return;
    const ch = supabase
      .channel(`challenge-${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "challenges", filter: `id=eq.${id}` },
        () => void load()
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "challenge_messages", filter: `challenge_id=eq.${id}` },
        () => void load()
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [id, load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isParticipant =
    user && challenge && (user.id === challenge.challenger_id || user.id === challenge.opponent_id);
  const isChallenger = user?.id === challenge?.challenger_id;
  const opponentId = challenge?.opponent_id;
  const handleAccept = async () => {
    if (!id) return;
    const { data, error } = await supabase.rpc("accept_challenge", { p_challenge_id: id });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Desafío aceptado" });
    setChallenge(await fetchChallengeById(data.id));
  };

  const sendMessage = async () => {
    if (!user || !id || !chatText.trim()) return;
    const { error } = await supabase.from("challenge_messages").insert({
      challenge_id: id,
      user_id: user.id,
      content: chatText.trim(),
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setChatText("");
  };

  const confirmMeet = async () => {
    if (!id) return;
    const { error } = await supabase.rpc("confirm_challenge_meet", {
      p_challenge_id: id,
      p_meet_day: meetDay,
      p_meet_time: meetTime,
      p_meet_timezone: meetTz,
      p_meet_channel: meetChannel.trim(),
      p_meet_city: meetCity.trim(),
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "¡Cita confirmada!", description: "La comunidad ya puede ver el duelo." });
    void load();
  };

  const cancelInactivity = async () => {
    if (!id || !confirm("¿Cancelar por inactividad del rival?")) return;
    const { error } = await supabase.rpc("cancel_challenge_inactivity", { p_challenge_id: id });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Reto cancelado" });
    void load();
  };

  const reportWinner = async (winnerId: string) => {
    if (!id) return;
    const { error } = await supabase.rpc("report_challenge_result", {
      p_challenge_id: id,
      p_winner_id: winnerId,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Resultado enviado" });
    void load();
  };

  const submitDispute = async (reason: "result_mismatch" | "non_payment") => {
    if (!id || !user) return;
    let proofPath: string | null = null;

    if (proofFile) {
      const ext = proofFile.name.toLowerCase().endsWith(".png") ? "png" : "jpg";
      if (!["image/jpeg", "image/png", "image/jpg"].includes(proofFile.type)) {
        toast({
          title: "Formato no válido",
          description: "Solo JPG o PNG.",
          variant: "destructive",
        });
        return;
      }
      if (proofFile.size > 5 * 1024 * 1024) {
        toast({
          title: "Archivo muy grande",
          description: "Máximo 5 MB.",
          variant: "destructive",
        });
        return;
      }
      proofPath = `${user.id}/${id}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("challenge-proofs")
        .upload(proofPath, proofFile, { upsert: true });
      if (upErr) {
        toast({ title: "Error al subir", description: upErr.message, variant: "destructive" });
        return;
      }
    }

    const { error } = await supabase.rpc("open_challenge_dispute", {
      p_challenge_id: id,
      p_reason: reason,
      p_proof_path: proofPath ?? "",
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Disputa abierta", description: "El staff revisará el caso." });
    setProofFile(null);
    void load();
  };

  if (loading || !challenge) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  const spectator = buildSpectatorAnnouncement(challenge);
  const canAccept =
    challenge.status === "pendiente" &&
    user &&
    user.id !== challenge.challenger_id &&
    (!challenge.opponent_id || challenge.opponent_id === user.id);

  return (
    <div className="min-h-screen bg-background relative">
      <div className="grid-bg fixed inset-0 pointer-events-none opacity-60" />
      <Navbar active="" onNavigate={() => navigate("/")} />

      <main className="relative pt-24 pb-20">
        <div className="container max-w-3xl">
          <Link
            to="/desafios"
            className="inline-flex items-center gap-2 text-foreground/60 hover:text-primary mb-6 font-display text-xs tracking-widest"
          >
            <ArrowLeft size={14} /> ARENA
          </Link>

          <ChallengeSteps challenge={challenge} />

          {canAccept && (
            <Button onClick={handleAccept} className="w-full mb-6 font-display tracking-widest bg-gradient-neon text-background">
              ACEPTAR DESAFÍO
            </Button>
          )}

          {spectator && challenge.meet_confirmed_at && (
            <div className="neon-border rounded-lg p-4 mb-6 bg-accent/5 border-accent/40">
              <p className="font-display text-xs text-accent tracking-widest mb-1">ESPECTADORES</p>
              <p className="text-sm">{spectator}</p>
            </div>
          )}

          {challenge.status === "aceptado" && isParticipant && !challenge.meet_confirmed_at && (
            <section className="neon-border rounded-lg p-5 mb-6 space-y-4 bg-card/70">
              <h2 className="font-display text-lg tracking-wider text-primary">PASO 2 — Acordar duelo</h2>
              <div className="max-h-48 overflow-y-auto space-y-2 rounded border border-border/50 p-3 bg-background/40">
                {messages.map((m) => (
                  <p key={m.id} className="text-sm">
                    <span className="font-display text-[10px] text-accent">{m.author?.username}: </span>
                    {m.content}
                  </p>
                ))}
                <div ref={bottomRef} />
              </div>
              <div className="flex gap-2">
                <Input
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                  placeholder="Mensaje al rival..."
                  className="bg-background/60"
                  onKeyDown={(e) => e.key === "Enter" && void sendMessage()}
                />
                <Button type="button" size="icon" onClick={() => void sendMessage()}>
                  <Send size={16} />
                </Button>
              </div>
              {isChallenger && challenge.accepted_at && (
                <Button variant="outline" size="sm" onClick={() => void cancelInactivity()} className="text-destructive">
                  Cancelar por inactividad (24h)
                </Button>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/40">
                <div>
                  <Label className="text-xs font-display tracking-widest">DÍA</Label>
                  <Input type="date" value={meetDay} onChange={(e) => setMeetDay(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs font-display tracking-widest">HORA</Label>
                  <Input type="time" value={meetTime} onChange={(e) => setMeetTime(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs font-display tracking-widest">ZONA / PAÍS</Label>
                  <Select value={meetTz} onValueChange={setMeetTz}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONE_OPTIONS.map((z) => (
                        <SelectItem key={z} value={z}>
                          {z}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-display tracking-widest">CANAL</Label>
                  <Input value={meetChannel} onChange={(e) => setMeetChannel(e.target.value)} className="mt-1" />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs font-display tracking-widest">CIUDAD POKÉMMO</Label>
                  <Input value={meetCity} onChange={(e) => setMeetCity(e.target.value)} className="mt-1" />
                </div>
              </div>
              <Button onClick={() => void confirmMeet()} className="w-full font-display tracking-widest">
                CONFIRMAR CITA (PASO 3)
              </Button>
            </section>
          )}

          {challenge.status === "aceptado" && isParticipant && challenge.meet_confirmed_at && (
            <section className="neon-border rounded-lg p-5 mb-6 bg-card/70 space-y-4">
              <h2 className="font-display text-lg tracking-wider text-accent">PASO 4 — Resultado</h2>
              {!canReportResult(challenge) ? (
                <p className="text-sm text-foreground/60">
                  Podrás reportar cuando llegue la hora del combate (
                  {challenge.meet_at ? new Date(challenge.meet_at).toLocaleString("es-ES") : "—"}).
                </p>
              ) : (
                <>
                  <p className="text-sm text-foreground/70">¿Quién ganó el duelo?</p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => void reportWinner(challenge.challenger_id)}
                    >
                      Gana{" "}
                      {displayPokemmoNick(
                        challenge.challenger?.pokemmo_nick,
                        challenge.challenger?.username ?? "A"
                      )}
                    </Button>
                    {opponentId && (
                      <Button
                        className="flex-1"
                        variant="secondary"
                        onClick={() => void reportWinner(opponentId)}
                      >
                        Gana{" "}
                        {displayPokemmoNick(
                          challenge.opponent?.pokemmo_nick,
                          challenge.opponent?.username ?? "B"
                        )}
                      </Button>
                    )}
                  </div>
                  <div className="border-t border-border/40 pt-4 space-y-2">
                    <p className="text-xs text-foreground/60">
                      ¿Discrepancia o impago de Pokedólares? Adjunta captura (JPG/PNG, máx. 5MB).
                    </p>
                    <Input
                      type="file"
                      accept="image/jpeg,image/png,.jpg,.png"
                      onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void submitDispute("result_mismatch")}
                      >
                        Disputa resultado
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void submitDispute("non_payment")}
                      >
                        Disputa impago
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </section>
          )}

          {challenge.status === "disputa" && (
            <p className="text-center text-destructive font-display tracking-wider py-4">
              ⚠ Reto en disputa — esperando resolución del staff
            </p>
          )}

          {challenge.status === "completado" && (
            <p className="text-center text-primary font-display tracking-wider py-4">
              ✓ Reto completado
              {!challenge.counts_for_ranking && " (sin puntos de ranking: límite diario entre estos jugadores)"}
            </p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DesafioDetail;
