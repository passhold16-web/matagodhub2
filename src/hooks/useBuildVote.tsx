import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

/**
 * Manages a user's vote on a single build, with optimistic UI and realtime sync.
 * Returns the current vote state, total count, and a toggle function.
 */
export function useBuildVote(buildId: string, initialCount: number) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [voted, setVoted] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);

  // Sync from parent only when buildId changes (avoids overwriting optimistic updates).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setCount(initialCount);
  }, [buildId]);

  // Load whether the current user has voted
  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setVoted(false);
      return;
    }
    supabase
      .from("votes")
      .select("id")
      .eq("build_id", buildId)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setVoted(!!data);
      });
    return () => {
      cancelled = true;
    };
  }, [buildId, user]);

  // Realtime updates for this build's vote count
  useEffect(() => {
    const channel = supabase
      .channel(`build-votes-${buildId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "votes",
          filter: `build_id=eq.${buildId}`,
        },
        async () => {
          const { count: c } = await supabase
            .from("votes")
            .select("id", { count: "exact", head: true })
            .eq("build_id", buildId);
          if (typeof c === "number") setCount(c);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [buildId]);

  const toggle = useCallback(async () => {
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Necesitas una cuenta para votar builds.",
      });
      return;
    }
    if (busy) return;
    setBusy(true);

    if (voted) {
      // Optimistic
      setVoted(false);
      setCount((c) => Math.max(0, c - 1));
      const { error } = await supabase
        .from("votes")
        .delete()
        .eq("build_id", buildId)
        .eq("user_id", user.id);
      if (error) {
        setVoted(true);
        setCount((c) => c + 1);
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    } else {
      setVoted(true);
      setCount((c) => c + 1);
      const { error } = await supabase
        .from("votes")
        .insert({ build_id: buildId, user_id: user.id });
      if (error) {
        setVoted(false);
        setCount((c) => Math.max(0, c - 1));
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    }

    setBusy(false);
  }, [user, voted, busy, buildId, toast]);

  return { voted, count, toggle, busy, canVote: !!user };
}
