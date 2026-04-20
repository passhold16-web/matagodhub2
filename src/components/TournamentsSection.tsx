import { Trophy, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const TOURNAMENTS = [
  {
    id: "1",
    name: "MATAGOD CUP — Spring Reign",
    date: "12 MAY 2025",
    players: 256,
    prize: "500.000 ₽",
    tier: "OU",
    status: "OPEN",
  },
  {
    id: "2",
    name: "Underground UU Brawl",
    date: "19 MAY 2025",
    players: 128,
    prize: "250.000 ₽",
    tier: "UU",
    status: "OPEN",
  },
  {
    id: "3",
    name: "Little Cup Championship",
    date: "02 JUN 2025",
    players: 64,
    prize: "150.000 ₽",
    tier: "LC",
    status: "SOON",
  },
  {
    id: "4",
    name: "NU Apocalypse Series",
    date: "16 JUN 2025",
    players: 96,
    prize: "180.000 ₽",
    tier: "NU",
    status: "SOON",
  },
];

export const TournamentsSection = () => {
  return (
    <section id="torneos" className="py-20 md:py-28 relative">
      <div className="container">
        <div className="text-center mb-12">
          <p className="font-display text-xs tracking-[0.4em] text-accent mb-3">
            ◆ ARENA OFICIAL ◆
          </p>
          <h2 className="font-display text-4xl md:text-6xl font-black mb-4">
            <span className="text-foreground">TORNEOS</span>{" "}
            <span className="neon-text-gold">ÉLITE</span>
          </h2>
          <p className="text-foreground/70 max-w-2xl mx-auto">
            Compite contra los mejores. Premios reales. Gloria eterna.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {TOURNAMENTS.map((t, i) => (
            <article
              key={t.id}
              className="glass-strong rounded-lg p-6 group hover:border-accent/60 transition-all animate-fade-in-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-md bg-gradient-neon flex items-center justify-center shadow-[0_0_20px_hsl(var(--primary)/0.5)]">
                    <Trophy className="text-background" size={24} />
                  </div>
                  <div>
                    <span className={`tier-badge tier-${t.tier}`}>{t.tier}</span>
                    <h3 className="font-display text-lg md:text-xl font-bold mt-1">
                      {t.name}
                    </h3>
                  </div>
                </div>
                <span
                  className={`font-display text-xs px-3 py-1 rounded-full border tracking-widest ${
                    t.status === "OPEN"
                      ? "border-primary text-primary bg-primary/10"
                      : "border-muted-foreground text-muted-foreground"
                  }`}
                >
                  {t.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-sm mb-5">
                <div className="flex items-center gap-2 text-foreground/80">
                  <Calendar size={14} className="text-accent" />
                  <span className="font-display tracking-wider">{t.date}</span>
                </div>
                <div className="flex items-center gap-2 text-foreground/80">
                  <Users size={14} className="text-accent" />
                  <span className="font-display tracking-wider">{t.players}</span>
                </div>
                <div className="text-right">
                  <span className="font-display neon-text-gold tracking-wider">
                    {t.prize}
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full font-display tracking-widest border-primary/60 text-foreground hover:bg-primary hover:text-primary-foreground"
                disabled={t.status !== "OPEN"}
              >
                {t.status === "OPEN" ? "INSCRIBIRSE" : "PRÓXIMAMENTE"}
              </Button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
