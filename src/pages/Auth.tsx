import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";

type Mode = "login" | "signup" | "forgot";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const initialMode = (searchParams.get("mode") as Mode) || "login";
  const [mode, setMode] = useState<Mode>(
    initialMode === "signup" || initialMode === "forgot" ? initialMode : "login"
  );
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && user) navigate("/", { replace: true });
  }, [user, authLoading, navigate]);

  const validateEmail = (value: string) => /^\S+@\S+\.\S+$/.test(value.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const cleanEmail = email.trim().toLowerCase();

    // ---------- Forgot password ----------
    if (mode === "forgot") {
      if (!validateEmail(cleanEmail)) {
        toast.error("Introduce un email válido.");
        return;
      }
      setSubmitting(true);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Te hemos enviado un email para recuperar tu contraseña.");
        setMode("login");
      } catch (err: any) {
        toast.error(err?.message ?? "No se pudo enviar el email de recuperación.");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // ---------- Sign up ----------
    if (mode === "signup") {
      const cleanUser = username.trim();
      if (!validateEmail(cleanEmail)) {
        toast.error("Introduce un email válido.");
        return;
      }
      if (cleanUser.length < 3) {
        toast.error("El usuario debe tener al menos 3 caracteres.");
        return;
      }
      if (!/^[a-zA-Z0-9_.-]+$/.test(cleanUser)) {
        toast.error("Usuario: solo letras, números, . _ -");
        return;
      }
      if (password.length < 6) {
        toast.error("La contraseña debe tener al menos 6 caracteres.");
        return;
      }

      setSubmitting(true);
      try {
        const { error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { username: cleanUser },
          },
        });
        if (error) throw error;
        toast.success(
          "Cuenta creada. Revisa tu email para confirmar la dirección y poder iniciar sesión."
        );
        setMode("login");
      } catch (err: any) {
        const msg = (err?.message ?? "Error desconocido").toLowerCase();
        if (msg.includes("already registered") || msg.includes("user already")) {
          toast.error("Ese email ya está registrado. Inicia sesión.");
        } else if (msg.includes("pwned") || msg.includes("leaked")) {
          toast.error("Esta contraseña ha sido filtrada en otra web. Usa otra distinta.");
        } else {
          toast.error(err?.message ?? "Error desconocido");
        }
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // ---------- Login ----------
    if (!validateEmail(cleanEmail)) {
      toast.error("Introduce un email válido.");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      if (error) throw error;
      toast.success("Sesión iniciada.");
      navigate("/", { replace: true });
    } catch (err: any) {
      const msg = (err?.message ?? "Error desconocido").toLowerCase();
      if (msg.includes("invalid login")) {
        toast.error("Email o contraseña incorrectos.");
      } else if (msg.includes("email not confirmed")) {
        toast.error("Confirma tu email antes de iniciar sesión.");
      } else {
        toast.error(err?.message ?? "Error desconocido");
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
          {mode !== "forgot" && (
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
          )}

          {mode === "forgot" && (
            <div className="mb-6 text-center">
              <h2 className="font-display text-lg tracking-widest text-primary">
                RECUPERAR CONTRASEÑA
              </h2>
              <p className="text-xs text-foreground/60 mt-1">
                Te enviaremos un enlace a tu email para restablecerla.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="trainer@ejemplo.com"
                autoComplete="email"
                className="bg-background/60 border-primary/30 focus-visible:ring-primary"
                maxLength={120}
              />
            </div>

            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="username" className="font-display text-xs tracking-widest text-foreground/80">
                  USUARIO PÚBLICO
                </Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="ash_ketchum"
                  autoComplete="username"
                  className="bg-background/60 border-primary/30 focus-visible:ring-primary"
                  maxLength={24}
                />
                <p className="text-[10px] text-foreground/50">
                  Solo letras, números, . _ - · Mínimo 3 caracteres.
                </p>
              </div>
            )}

            {mode !== "forgot" && (
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
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  placeholder="••••••••"
                  className="bg-background/60 border-primary/30 focus-visible:ring-primary"
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full font-display tracking-widest bg-gradient-neon text-background hover:opacity-90 shadow-[0_0_20px_hsl(var(--primary)/0.5)]"
            >
              {submitting ? (
                <Loader2 className="animate-spin" size={16} />
              ) : mode === "login" ? (
                "ENTRAR AL HUB"
              ) : mode === "signup" ? (
                "CREAR CUENTA"
              ) : (
                "ENVIAR ENLACE"
              )}
            </Button>
          </form>

          {mode === "login" && (
            <p className="mt-4 text-center text-xs">
              <button
                type="button"
                onClick={() => setMode("forgot")}
                className="text-foreground/60 hover:text-primary font-display tracking-wider transition-colors"
              >
                ¿OLVIDASTE TU CONTRASEÑA?
              </button>
            </p>
          )}

          <p className="mt-6 text-center text-xs text-foreground/50 font-display tracking-wider">
            {mode === "forgot" ? (
              <>
                ¿RECORDASTE LA CONTRASEÑA?{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-accent hover:text-accent-glow underline-offset-4 hover:underline"
                >
                  INICIAR SESIÓN
                </button>
              </>
            ) : mode === "login" ? (
              <>
                ¿NUEVO ENTRENADOR?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="text-accent hover:text-accent-glow underline-offset-4 hover:underline"
                >
                  REGÍSTRATE
                </button>
              </>
            ) : (
              <>
                ¿YA TIENES CUENTA?{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-accent hover:text-accent-glow underline-offset-4 hover:underline"
                >
                  INICIA SESIÓN
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
