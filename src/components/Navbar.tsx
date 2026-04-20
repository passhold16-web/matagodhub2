import { useState } from "react";
import { Menu, X } from "lucide-react";

const NAV_ITEMS = [
  { id: "home", label: "Home" },
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

  const handleClick = (id: string) => {
    onNavigate(id);
    setOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-primary/30">
      <div className="container flex h-16 items-center justify-between">
        <button
          onClick={() => handleClick("home")}
          className="flex items-center gap-2 group"
          aria-label="MATAGOD HUB inicio"
        >
          <div className="h-8 w-8 rounded-md bg-gradient-neon animate-pulse-glow" />
          <span
            className="glitch text-xl md:text-2xl"
            data-text="MATAGOD"
          >
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
          </nav>
        </div>
      )}
    </header>
  );
};
