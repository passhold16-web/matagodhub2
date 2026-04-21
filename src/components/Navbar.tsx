import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Menu, Settings, User as UserIcon, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { id: "home", label: "Inicio" },
  { id: "builds", label: "Builds" },
  { id: "torneos", label: "Torneos" },
  { id: "comunidad", label: "Comunidad" },
];

interface NavbarProps {
  active: string;
  onNavigate: (id: string) => void;
}

export const Navbar = ({ active, onNavigate }: NavbarProps) => {
  const [open, setOpen] = useState(false);
  const { user, profile, signOut, loading } = useAuth();
  const navigate = useNavigate();

  const handleClick = (id: string) => {
    onNavigate(id);
    setOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSignOut = async () => {
    await signOut();
    setOpen(false);
  };

  const displayName = profile?.username ?? user?.email?.split("@")[0] ?? "TRAINER";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-primary/30">
      <div className="container flex h-16 items-center justify-between gap-4">
        <button
          onClick={() => handleClick("home")}
          className="flex items-center gap-2 group shrink-0"
          aria-label="MATAGOD HUB inicio"
        >
          <div className="h-8 w-8 rounded-md bg-gradient-neon animate-pulse-glow" />
          <span className="glitch text-xl md:text-2xl" data-text="MATAGOD">
            MATAGOD
          </span>
          <span className="font-display text-xs md:text-sm text-accent tracking-[0.3em] hidden sm:inline">
            HUB
          </span>
        </button>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => handleClick(item.id)}
              className={`relative px-4 py-2 font-display text-sm tracking-wider transition-colors ${
                active === item.id
                  ? "text-primary"
                  : "text-foreground/70 hover:text-foreground"
              }`}
            >
              {item.label}
              {active === item.id && (
                <span className="absolute inset-x-2 -bottom-0.5 h-0.5 bg-primary shadow-[0_0_10px_hsl(var(--primary))]" />
              )}
            </button>
          ))}
        </nav>

        {/* Auth area — desktop */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          {!loading && user ? (
            <>
              <button
                onClick={() => navigate(`/perfil/${profile?.username ?? ""}`)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md glass border border-accent/30 hover:border-accent transition-colors"
                aria-label="Ver mi perfil"
              >
                <UserIcon size={14} className="text-accent" />
                <span className="font-display text-xs tracking-widest text-accent max-w-[120px] truncate">
                  {displayName}
                </span>
              </button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/perfil/editar")}
                className="font-display text-xs tracking-widest text-foreground/70 hover:text-accent hover:bg-accent/10"
                aria-label="Editar perfil"
              >
                <Settings size={14} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="font-display text-xs tracking-widest text-foreground/70 hover:text-primary hover:bg-primary/10"
                aria-label="Cerrar sesión"
              >
                <LogOut size={14} />
              </Button>
            </>
          ) : !loading ? (
            <Button
              size="sm"
              onClick={() => navigate("/auth")}
              className="font-display text-xs tracking-widest bg-gradient-neon text-background hover:opacity-90 shadow-[0_0_15px_hsl(var(--primary)/0.4)]"
            >
              INICIAR SESIÓN
            </Button>
          ) : null}
        </div>

        {/* Mobile burger */}
        <button
          className="md:hidden p-2 text-foreground"
          onClick={() => setOpen((o) => !o)}
          aria-label="Abrir menú"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden glass-strong border-t border-primary/30">
          <nav className="container flex flex-col py-3">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => handleClick(item.id)}
                className={`text-left py-3 font-display tracking-wider ${
                  active === item.id ? "text-primary" : "text-foreground/80"
                }`}
              >
                {item.label}
              </button>
            ))}

            <div className="border-t border-primary/20 mt-2 pt-3 space-y-2">
              {!loading && user ? (
                <>
                  <button
                    onClick={() => {
                      setOpen(false);
                      navigate(`/perfil/${profile?.username ?? ""}`);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-md glass border border-accent/30 text-left"
                  >
                    <UserIcon size={14} className="text-accent shrink-0" />
                    <span className="font-display text-xs tracking-widest text-accent truncate flex-1">
                      {displayName}
                    </span>
                  </button>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setOpen(false);
                        navigate("/perfil/editar");
                      }}
                      className="flex-1 font-display text-xs tracking-widest border-accent/40 text-accent"
                    >
                      <Settings size={12} className="mr-1.5" /> EDITAR PERFIL
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSignOut}
                      className="font-display text-xs tracking-widest text-foreground/70"
                      aria-label="Cerrar sesión"
                    >
                      <LogOut size={14} />
                    </Button>
                  </div>
                </>
              ) : !loading ? (
                <Button
                  onClick={() => {
                    setOpen(false);
                    navigate("/auth");
                  }}
                  className="w-full font-display tracking-widest bg-gradient-neon text-background"
                >
                  INICIAR SESIÓN
                </Button>
              ) : null}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
