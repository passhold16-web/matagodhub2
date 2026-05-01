import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface OnlineUser {
  user_id: string;
  username: string;
  avatar_url: string | null;
  online_at: string;
}

interface PresenceContextValue {
  online: OnlineUser[];
  count: number;
  isOnline: (userId: string) => boolean;
}

const PresenceContext = createContext<PresenceContextValue | undefined>(undefined);

export const PresenceProvider = ({ children }: { children: ReactNode }) => {
  const { user, profile } = useAuth();
  const [online, setOnline] = useState<OnlineUser[]>([]);

  useEffect(() => {
    const channel = supabase.channel("global_presence", {
      config: { presence: { key: user?.id ?? `guest-${Math.random().toString(36).slice(2)}` } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<OnlineUser>();
        // Deduplicate by user_id (a user may have multiple tabs)
        const seen = new Map<string, OnlineUser>();
        Object.values(state).forEach((arr) => {
          arr.forEach((p) => {
            if (p.user_id && !seen.has(p.user_id)) seen.set(p.user_id, p);
          });
        });
        setOnline(Array.from(seen.values()));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED" && user && profile) {
          await channel.track({
            user_id: user.id,
            username: profile.username,
            avatar_url: profile.avatar_url,
            online_at: new Date().toISOString(),
          } as OnlineUser);
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id, profile?.username, profile?.avatar_url]);

  const value = useMemo<PresenceContextValue>(
    () => ({
      online,
      count: online.length,
      isOnline: (id: string) => online.some((u) => u.user_id === id),
    }),
    [online]
  );

  return <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>;
};

export const usePresence = () => {
  const ctx = useContext(PresenceContext);
  if (!ctx) throw new Error("usePresence must be used within PresenceProvider");
  return ctx;
};
