import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  tournamentId: string | null;
  tournamentName?: string;
  onDone?: () => void;
}

export const TournamentRegisterModal = ({
  open,
  onOpenChange,
  tournamentId,
  tournamentName,
  onDone,
}: Props) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) setDescription("");
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !tournamentId) return;
    if (description.trim().length < 5) {
      toast({ title: "Descripción muy corta", description: "Mínimo 5 caracteres." });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("tournament_registrations").insert({
      tournament_id: tournamentId,
      user_id: user.id,
      description: description.trim(),
    });
    setSubmitting(false);
    if (error) {
      if (error.code === "23505") {
        toast({ title: "Ya estás inscrito", description: "Solo puedes inscribirte una vez.", variant: "destructive" });
      } else {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
      return;
    }
    toast({ title: "¡Inscrito!", description: "Tu post aparecerá en el torneo." });
    onOpenChange(false);
    onDone?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card/95 backdrop-blur-xl border-primary/40">
        <DialogHeader>
          <DialogTitle className="font-display tracking-widest neon-text-gold">
            INSCRIBIRSE
          </DialogTitle>
          <DialogDescription>
            {tournamentName ? `Torneo: ${tournamentName}` : "Únete al torneo"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="font-display text-xs tracking-widest text-foreground/80">
              USUARIO
            </Label>
            <div className="px-3 py-2 rounded-md bg-muted/40 border border-border font-display text-sm text-accent tracking-wider">
              {profile?.username ?? "..."}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="desc" className="font-display text-xs tracking-widest text-foreground/80">
              TU POST
            </Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Cuéntanos lo Pro que eres"
              maxLength={500}
              rows={5}
              className="bg-background/60 border-primary/30 focus-visible:ring-primary resize-none"
            />
            <p className="text-[10px] text-muted-foreground text-right">{description.length}/500</p>
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full font-display tracking-widest bg-gradient-neon text-background hover:opacity-90 shadow-[0_0_20px_hsl(var(--primary)/0.5)]"
          >
            {submitting ? <Loader2 className="animate-spin" size={16} /> : "CONFIRMAR INSCRIPCIÓN"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
