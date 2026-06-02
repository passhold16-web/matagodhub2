import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ChallengeCard } from "@/components/challenges/ChallengeCard";
import { CreateChallengeModal } from "@/components/challenges/CreateChallengeModal";
import { attachProfilesToChallenges } from "@/lib/fetchChallenges";
import type { ChallengeRow, ChallengeWithProfiles } from "@/types/challenges";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Swords } from "lucide-react";

const Desafios = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [challenges, setChallenges] = useState<ChallengeWithProfiles[]>([]);
  const [rivals, setRivals] = useState<
    { user_id: string; username: string; pokemmo_nick: string | null }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("challenges")
      .select("*")
      .in("status", ["pendiente", "aceptado", "disputa"])
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setChallenges([]);
    } else {
      setChallenges(await attachProfilesToChallenges((data ?? []) as ChallengeRow[]));
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    void load();
    void supabase
      .from("profiles")
      .select("user_id, username, pokemmo_nick")
      .order("username")
      .then(({ data }) => setRivals(data ?? []));

    const channel = supabase
      .channel("challenges-board")
      .on("postgres_changes", { event: "*", schema: "public", table: "challenges" }, () => void load())
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [load]);

  const handleAccept = async (id: string) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setAcceptingId(id);
    const { data, error } = await supabase.rpc("accept_challenge", { p_challenge_id: id });
    setAcceptingId(null);
    if (error) {
      toast({ title: "No se pudo aceptar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "¡Desafío aceptado!" });
    navigate(`/desafios/${data.id}`);
  };

  return (
    <div className="min-h-screen bg-background relative">
      <div className="grid-bg fixed inset-0 pointer-events-none opacity-60" />
      <Navbar active="" onNavigate={() => navigate("/")} />

      <main className="relative pt-24 pb-20">
        <div className="container max-w-6xl">
          <header className="text-center mb-10">
            <p className="font-display text-xs tracking-[0.4em] text-accent mb-3">
              ◆ PVP COMPETITIVO ◆
            </p>
            <h1 className="font-display text-4xl md:text-6xl font-black mb-4">
              <span className="neon-text-red">ARENA</span>{" "}
              <span className="text-foreground">DE COMBATE</span>
            </h1>
            <p className="text-foreground/70 max-w-2xl mx-auto mb-6">
              Retos con Pokedólares, cita en PokéMMO y ranking de victorias.
            </p>
            {user ? (
              <Button
                onClick={() => setCreateOpen(true)}
                className="font-display tracking-widest bg-gradient-neon text-background"
              >
                <Plus size={16} className="mr-2" /> LANZAR DESAFÍO
              </Button>
            ) : (
              <Button onClick={() => navigate("/auth")} variant="outline" className="font-display tracking-widest">
                INICIA SESIÓN PARA RETAR
              </Button>
            )}
          </header>

          {loading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : challenges.length === 0 ? (
            <div className="text-center py-20 neon-border rounded-lg bg-card/50">
              <Swords className="mx-auto text-primary mb-4" size={40} />
              <p className="font-display tracking-wider text-foreground/70">
                No hay retos activos. ¡Sé el primero en lanzar uno!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {challenges.map((c) => (
                <ChallengeCard
                  key={c.id}
                  challenge={c}
                  currentUserId={user?.id}
                  onAccept={handleAccept}
                  accepting={acceptingId === c.id}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />

      <CreateChallengeModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={load}
        rivals={rivals}
      />
    </div>
  );
};

export default Desafios;
