import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Swords, Loader2 } from "lucide-react";
import { attachProfilesToChallenges } from "@/lib/fetchChallenges";
import type { ChallengeRow, ChallengeWithProfiles } from "@/types/challenges";
import { buildArenaHeadline } from "@/lib/challengeHelpers";

export const LatestChallengeWidget = () => {
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState<ChallengeWithProfiles | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("challenges")
        .select("*")
        .in("status", ["pendiente", "aceptado", "disputa"])
        .order("created_at", { ascending: false })
        .limit(1);

      if (data?.[0]) {
        const [enriched] = await attachProfilesToChallenges([data[0] as ChallengeRow]);
        setChallenge(enriched ?? null);
      } else {
        setChallenge(null);
      }
      setLoading(false);
    };
    void load();
  }, []);

  if (loading) {
    return (
      <div className="neon-border rounded-lg p-6 flex justify-center bg-card/50">
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  if (!challenge) return null;

  return (
    <button
      type="button"
      onClick={() => navigate("/desafios")}
      className="w-full text-left neon-border rounded-lg p-6 bg-gradient-to-br from-card/90 to-primary/5 hover:shadow-[0_0_25px_hsl(var(--primary)/0.35)] transition-all group"
    >
      <div className="flex items-center gap-2 mb-3">
        <Swords className="text-primary group-hover:scale-110 transition-transform" size={22} />
        <span className="font-display text-xs tracking-[0.35em] text-accent">
          ◆ ARENA DE COMBATE ◆
        </span>
      </div>
      <p className="font-display text-lg md:text-xl tracking-wide text-foreground group-hover:text-primary transition-colors">
        {buildArenaHeadline(challenge)}
      </p>
      <p className="mt-3 font-display text-[10px] tracking-widest text-primary">
        VER TODOS LOS RETOS →
      </p>
    </button>
  );
};
