import { MessageSquare, Users, Zap, MessagesSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const CommunitySection = () => {
  const navigate = useNavigate();
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
            Conecta con la élite. Chat en vivo, foro y rankings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Foro card */}
          <article className="neon-border rounded-lg p-8 bg-card/60 backdrop-blur-xl text-center group">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-neon mb-4 animate-pulse-glow">
              <MessagesSquare className="text-background" size={28} />
            </div>
            <h3 className="font-display text-2xl font-bold mb-2 neon-text-gold tracking-wider">
              FORO
            </h3>
            <p className="text-foreground/70 mb-6 text-sm">
              Estrategia, PvE, eventos y off-topic. Publica posts y debate con
              la comunidad.
            </p>
            <Button
              onClick={() => navigate("/foro")}
              className="font-display tracking-widest bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_hsl(var(--primary)/0.4)]"
            >
              IR AL FORO
            </Button>
          </article>

          {/* Chat card */}
          <article className="neon-border rounded-lg p-8 bg-card/60 backdrop-blur-xl text-center group">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-neon mb-4 animate-pulse-glow">
              <MessageSquare className="text-background" size={28} />
            </div>
            <h3 className="font-display text-2xl font-bold mb-2 neon-text-gold tracking-wider">
              CHAT EN VIVO
            </h3>
            <p className="text-foreground/70 mb-6 text-sm">
              Habla con otros trainers en tiempo real. Estrategias, dudas o
              simplemente echar el rato.
            </p>
            <Button
              onClick={() => navigate("/chat")}
              variant="outline"
              className="font-display tracking-widest border-accent text-accent hover:bg-accent/10"
            >
              ENTRAR AL CHAT
            </Button>
          </article>
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
          {[
            { icon: MessageSquare, label: "Chat en vivo" },
            { icon: Users, label: "Perfiles" },
            { icon: Zap, label: "Rankings (próximamente)" },
          ].map((f) => (
            <div
              key={f.label}
              className="glass rounded-md py-4 flex flex-col items-center gap-2"
            >
              <f.icon className="text-primary" size={22} />
              <span className="font-display text-xs tracking-widest text-foreground/80 text-center px-2">
                {f.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
