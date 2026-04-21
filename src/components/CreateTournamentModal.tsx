import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { TIERS, type Tier } from "@/data/mockBuilds";
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: () => void;
}

export const CreateTournamentModal = ({ open, onOpenChange, onCreated }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tier, setTier] = useState<Tier>("OU");
  const [eventDate, setEventDate] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(64);
  const [prize, setPrize] = useState("");
  const [format, setFormat] = useState("");
  const [contactUrl, setContactUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setName("");
      setDescription("");
      setTier("OU");
      setEventDate("");
      setMaxPlayers(64);
      setPrize("");
      setFormat("");
      setContactUrl("");
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!user) return;
    if (!name.trim()) {
      toast({ title: "Falta el nombre", description: "Pon un título al torneo.", variant: "destructive" });
      return;
    }
    if (!eventDate) {
      toast({ title: "Falta la fecha", description: "Selecciona la fecha del evento.", variant: "destructive" });
      return;
    }
    const dateObj = new Date(eventDate);
    if (dateObj.getTime() < Date.now() - 3600 * 1000) {
      toast({
        title: "Fecha inválida",
        description: "El torneo debe ser en el futuro.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("tournaments").insert({
      user_id: user.id,
      name: name.trim(),
      description: description.trim() || null,
      tier,
      event_date: dateObj.toISOString(),
      max_players: maxPlayers,
      prize: prize.trim() || null,
      format: format.trim() || null,
      contact_url: contactUrl.trim() || null,
      status: "OPEN",
    });
    setSubmitting(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "¡Torneo publicado!", description: "Ya aparece en la sección Torneos." });
    onOpenChange(false);
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-primary/40 max-w-xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl tracking-wider neon-text-gold">
            PUBLICAR TORNEO
          </DialogTitle>
          <DialogDescription className="text-foreground/60">
            Anuncia tu torneo a toda la comunidad MATAGOD.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <label className="font-display text-xs tracking-widest text-foreground/70 mb-1 block">
              NOMBRE DEL TORNEO
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              placeholder="MATAGOD CUP — Spring Reign"
              className="bg-background/60 border-primary/30 focus:border-primary font-display tracking-wide"
            />
          </div>

          <div>
            <label className="font-display text-xs tracking-widest text-foreground/70 mb-1 block">
              TIER
            </label>
            <div className="flex gap-2 flex-wrap">
              {TIERS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTier(t)}
                  className={`px-4 py-1.5 rounded-md font-display text-sm tracking-widest border transition-all ${
                    tier === t
                      ? "bg-primary text-primary-foreground border-primary shadow-[0_0_15px_hsl(var(--primary)/0.5)]"
                      : "bg-card/40 text-foreground/60 border-border hover:border-primary/50"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-display text-xs tracking-widest text-foreground/70 mb-1 block">
                FECHA Y HORA
              </label>
              <Input
                type="datetime-local"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="bg-background/60 border-primary/30 focus:border-primary"
              />
            </div>
            <div>
              <label className="font-display text-xs tracking-widest text-foreground/70 mb-1 block">
                JUGADORES MÁXIMOS
              </label>
              <Input
                type="number"
                min={4}
                max={1024}
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(parseInt(e.target.value, 10) || 64)}
                className="bg-background/60 border-primary/30 focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-display text-xs tracking-widest text-foreground/70 mb-1 block">
                PREMIO (OPCIONAL)
              </label>
              <Input
                value={prize}
                onChange={(e) => setPrize(e.target.value)}
                maxLength={60}
                placeholder="500.000 ₽"
                className="bg-background/60 border-primary/30 focus:border-primary"
              />
            </div>
            <div>
              <label className="font-display text-xs tracking-widest text-foreground/70 mb-1 block">
                FORMATO (OPCIONAL)
              </label>
              <Input
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                maxLength={60}
                placeholder="Single Elimination BO3"
                className="bg-background/60 border-primary/30 focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="font-display text-xs tracking-widest text-foreground/70 mb-1 block">
              ENLACE DE INSCRIPCIÓN (OPCIONAL)
            </label>
            <Input
              type="url"
              value={contactUrl}
              onChange={(e) => setContactUrl(e.target.value)}
              maxLength={200}
              placeholder="https://discord.gg/..."
              className="bg-background/60 border-primary/30 focus:border-primary"
            />
          </div>

          <div>
            <label className="font-display text-xs tracking-widest text-foreground/70 mb-1 block">
              DESCRIPCIÓN
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={4}
              placeholder="Reglas, requisitos, dinámica..."
              className="bg-background/60 border-primary/30 focus:border-primary resize-none"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full font-display tracking-[0.3em] bg-gradient-neon text-background hover:opacity-90 shadow-[0_0_20px_hsl(var(--primary)/0.4)]"
          >
            {submitting ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
            PUBLICAR TORNEO
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
