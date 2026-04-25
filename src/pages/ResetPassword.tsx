import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";

/**
 * Reached after the user clicks the password-reset email link.
 * Supabase fires a `PASSWORD_RECOVERY` auth event with a valid recovery
 * session attached, allowing us to call updateUser({ password }).
 */
const ResetPassword = () => {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Listen for recovery session establishment
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
      }
    });

    // Also check if a session already exists (link clicked moments ago)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      toast.error("Las contraseñas no coinciden.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("pwned") || msg.includes("leaked")) {
        toast.error("Esta contraseña ha sido filtrada en otra web. Usa otra distinta.");
      } else {
        toast.error(error.message);
      }
      return;
    }
    toast.success("Contraseña actualizada. Ya puedes seguir usando la cuenta.");
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-16 overflow-hidden">
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
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-neon mb-3 animate-pulse-glow">
            <ShieldCheck className="text-background" size={26} />
          </div>
          <h1 className="font-display text-2xl md:text-3xl tracking-widest neon-text-gold">
            NUEVA CONTRASEÑA
          </h1>
          <p className="font-display text-[10px] tracking-[0.4em] text-accent mt-2">
            ◆ RECUPERACIÓN ◆
          </p>
        </div>

        <div className="neon-border rounded-lg bg-card/70 backdrop-blur-xl p-8">
          {!ready ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <Loader2 className="animate-spin text-primary" size={28} />
              <p className="text-sm text-foreground/60 text-center">
                Validando enlace de recuperación...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="password" className="font-display text-xs tracking-widest text-foreground/80">
                  NUEVA CONTRASEÑA
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="bg-background/60 border-primary/30 focus-visible:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm" className="font-display text-xs tracking-widest text-foreground/80">
                  CONFIRMAR CONTRASEÑA
                </Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="bg-background/60 border-primary/30 focus-visible:ring-primary"
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full font-display tracking-widest bg-gradient-neon text-background hover:opacity-90 shadow-[0_0_20px_hsl(var(--primary)/0.5)]"
              >
                {submitting ? <Loader2 className="animate-spin" size={16} /> : "GUARDAR CONTRASEÑA"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
