import { useState } from "react";
import { Link } from "react-router-dom";
import { Circle, Users, X, User as UserIcon } from "lucide-react";
import { usePresence } from "@/hooks/usePresence";

export const OnlineUsersWidget = () => {
  const { online, count } = usePresence();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md glass border border-primary/30 hover:border-primary transition-colors group"
        aria-label={`${count} usuarios en línea`}
        title={`${count} en línea`}
      >
        <span className="relative flex items-center justify-center">
          <Circle size={8} className="fill-primary text-primary animate-pulse" />
          <span className="absolute h-3 w-3 rounded-full bg-primary/40 animate-ping" />
        </span>
        <span className="font-display text-[10px] tracking-widest text-primary">
          {count}
        </span>
        <span className="font-display text-[10px] tracking-widest text-foreground/50 hidden md:inline">
          ONLINE
        </span>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="fixed top-16 right-2 sm:right-4 z-50 w-72 max-h-[70vh] glass-strong border border-primary/40 rounded-lg shadow-[0_0_30px_hsl(var(--primary)/0.3)] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 border-b border-primary/30 bg-card/60">
              <div className="flex items-center gap-2">
                <Users size={14} className="text-primary" />
                <span className="font-display text-xs tracking-widest text-primary">
                  EN LÍNEA · {count}
                </span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-foreground/60 hover:text-foreground"
                aria-label="Cerrar"
              >
                <X size={14} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 py-1">
              {online.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs text-foreground/50 font-display tracking-wider">
                  Nadie conectado.
                </div>
              ) : (
                online.map((u) => (
                  <Link
                    key={u.user_id}
                    to={`/perfil/${encodeURIComponent(u.username)}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 hover:bg-primary/10 transition-colors no-underline"
                  >
                    <div className="relative shrink-0">
                      <div className="h-8 w-8 rounded-full bg-gradient-neon overflow-hidden flex items-center justify-center">
                        {u.avatar_url ? (
                          <img
                            src={u.avatar_url}
                            alt={u.username}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <UserIcon size={14} className="text-background" />
                        )}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-primary border-2 border-background shadow-[0_0_6px_hsl(var(--primary))]" />
                    </div>
                    <span className="font-display text-xs tracking-wider text-accent truncate">
                      {u.username}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};
