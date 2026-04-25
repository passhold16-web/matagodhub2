import { Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface LoginWallProps {
  title?: string;
  description?: string;
}

/**
 * Gating screen shown when a guest tries to access community-only content
 * (Builds gallery, Foro, etc.). Mirrors the cyberpunk aesthetic of the rest
 * of the site and pushes users toward sign-in / sign-up.
 */
export const LoginWall = ({
  title = "CONTENIDO EXCLUSIVO",
  description = "Esta sección es solo para miembros de la comunidad. Inicia sesión o crea tu cuenta gratis para acceder.",
}: LoginWallProps) => {
  const navigate = useNavigate();

  return (
    <div className="max-w-lg mx-auto text-center py-16 px-4">
      <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-neon mb-6 animate-pulse-glow">
        <Lock className="text-background" size={32} />
      </div>
      <p className="font-display text-xs tracking-[0.4em] text-accent mb-3">
        ◆ ACCESO RESTRINGIDO ◆
      </p>
      <h2 className="font-display text-3xl md:text-4xl tracking-wider neon-text-red mb-4">
        {title}
      </h2>
      <p className="text-foreground/70 mb-8 text-sm md:text-base">{description}</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          onClick={() => navigate("/auth?mode=login")}
          className="font-display tracking-[0.25em] bg-gradient-neon text-background hover:opacity-90 shadow-[0_0_20px_hsl(var(--primary)/0.5)]"
        >
          INICIAR SESIÓN
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate("/auth?mode=signup")}
          className="font-display tracking-[0.25em] border-accent/60 text-accent hover:bg-accent/10"
        >
          CREAR CUENTA GRATIS
        </Button>
      </div>
    </div>
  );
};
