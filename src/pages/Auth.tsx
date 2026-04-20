import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && user) navigate("/", { replace: true });
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { username: username || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Cuenta creada — bienvenido al hub.");
        navigate("/", { replace: true });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Sesión iniciada.");
        navigate("/", { replace: true });
      }
    } catch (err: any) {
      const msg = err?.message ?? "Error desconocido";
      if (msg.toLowerCase().includes("invalid login")) {
        toast.error("Credenciales inválidas.");
      } else if (msg.toLowerCase().includes("already registered")) {
        toast.error("Este email ya está registrado. Inicia sesión.");
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-16 overflow-hidden">
      {/* Holographic backdrop */}
      <div className="absolute inset-0 grid-bg opacity-60 pointer-events-none" />
      <div className="absolute inset-0 bg-[var(--gradient-hero)] pointer-events-none" />

      <Link
        to="/"
        className="absolute top-6 left-6 z-10 flex items-center gap-2 text-foreground/70 hover:text-primary transition-colors font-display text-sm tracking-wider"
      >
        <ArrowLeft size={16} />
        VOLVER
      </Link>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <span className="glitch text-3xl md:text-4xl" data-text="MATAGOD">
            MATAGOD
          </span>
          <p className="font-display text-[10px] tracking-[0.4em] text-accent mt-2">
            ◆ ACCESO A LA RED ◆
          </p>
        </div>

        <div className="neon-border rounded-lg bg-card/70 backdrop-blur-xl p-8">
          <div className="flex gap-2 mb-6 p-1 bg-muted/40 rounded-md">
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`flex-1 py-2 font-display text-xs tracking-widest rounded-sm transition-all ${
                  mode === m
                    ? "bg-primary/20 text-primary shadow-[0_0_15px_hsl(var(--primary)/0.4)]"
                    : "text-foreground/60 hover:text-foreground"
                }`}
              >
                {m === "login" ? "INICIAR SESIÓN" : "REGISTRARSE"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="username" className="font-display text-xs tracking-widest text-foreground/80">
                  USERNAME
                </Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ash_ketchum"
                  className="bg-background/60 border-primary/30 focus-visible:ring-primary"
                  maxLength={24}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="font-display text-xs tracking-widest text-foreground/80">
                EMAIL
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="trainer@matagod.gg"
                className="bg-background/60 border-primary/30 focus-visible:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="font-display text-xs tracking-widest text-foreground/80">
                CONTRASEÑA
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
                className="bg-background/60 border-primary/30 focus-visible:ring-primary"
              />
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full font-display tracking-widest bg-gradient-neon text-background hover:opacity-90 shadow-[0_0_20px_hsl(var(--primary)/0.5)]"
            >
              {submitting ? (
                <Loader2 className="animate-spin" size={16} />
              ) : mode === "login" ? (
                "ENTRAR AL HUB"
              ) : (
                "CREAR CUENTA"
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-foreground/50 font-display tracking-wider">
            {mode === "login" ? "¿NUEVO ENTRENADOR?" : "¿YA TIENES CUENTA?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="text-accent hover:text-accent-glow underline-offset-4 hover:underline"
            >
              {mode === "login" ? "REGÍSTRATE" : "INICIA SESIÓN"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
