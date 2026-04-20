import { MessageSquare, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export const CommunitySection = () => {
  return (
    <section id="comunidad" className="py-20 md:py-28 relative">
      <div className="container">
        <div className="text-center mb-12">
          <p className="font-display text-xs tracking-[0.4em] text-accent mb-3">
            ◆ NETWORK ◆
          </p>
          <h2 className="font-display text-4xl md:text-6xl font-black mb-4">
            <span className="neon-text-red">COMUNIDAD</span>
          </h2>
          <p className="text-foreground/70 max-w-2xl mx-auto">
            La élite se conecta aquí. Pronto chat en vivo, perfiles y rankings.
          </p>
        </div>

        <div className="neon-border rounded-lg p-10 md:p-16 bg-card/60 backdrop-blur-xl text-center max-w-3xl mx-auto">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-neon mb-6 animate-pulse-glow">
            <Zap className="text-background" size={36} />
          </div>
          <h3 className="font-display text-2xl md:text-3xl font-bold mb-3 neon-text-gold tracking-wider">
            PRÓXIMAMENTE
          </h3>
          <p className="text-foreground/70 mb-8 max-w-xl mx-auto">
            El sistema de comunidad está siendo forjado. Chat en tiempo real,
            perfiles de entrenador, votación de builds y ranking competitivo.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[
              { icon: MessageSquare, label: "Chat Live" },
              { icon: Users, label: "Perfiles" },
              { icon: Zap, label: "Rankings" },
            ].map((f) => (
              <div key={f.label} className="glass rounded-md py-4 flex flex-col items-center gap-2">
                <f.icon className="text-primary" size={22} />
                <span className="font-display text-xs tracking-widest text-foreground/80">
                  {f.label}
                </span>
              </div>
            ))}
          </div>

          <Button
            disabled
            className="font-display tracking-widest bg-muted text-muted-foreground cursor-not-allowed"
          >
            FASE 2 — EN DESARROLLO
          </Button>
        </div>
      </div>
    </section>
  );
};
