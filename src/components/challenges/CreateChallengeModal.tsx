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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { CHALLENGE_FORMATS, type ChallengeFormat } from "@/types/challenges";
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: () => void;
  rivals: { user_id: string; username: string; pokemmo_nick: string | null }[];
  preselectedOpponentId?: string | null;
}

export const CreateChallengeModal = ({
  open,
  onOpenChange,
  onCreated,
  rivals,
  preselectedOpponentId,
}: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [format, setFormat] = useState<ChallengeFormat>("OU");
  const [prize, setPrize] = useState("");
  const [opponentMode, setOpponentMode] = useState<"open" | "target">(
    preselectedOpponentId ? "target" : "open"
  );
  const [opponentId, setOpponentId] = useState(preselectedOpponentId ?? "");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && preselectedOpponentId) {
      setOpponentMode("target");
      setOpponentId(preselectedOpponentId);
    }
  }, [open, preselectedOpponentId]);

  const handleSubmit = async () => {
    if (!user) return;
    const prizeNum = parseInt(prize.replace(/\D/g, ""), 10);
    if (!prizeNum || prizeNum < 1) {
      toast({
        title: "Recompensa inválida",
        description: "Indica los Pokedólares acordados.",
        variant: "destructive",
      });
      return;
    }
    if (opponentMode === "target" && !opponentId) {
      toast({
        title: "Elige un rival",
        description: "Selecciona a quién desafías.",
        variant: "destructive",
      });
      return;
    }
    if (opponentMode === "target" && opponentId === user.id) {
      toast({
        title: "Rival inválido",
        description: "No puedes desafiarte a ti mismo.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("challenges").insert({
      challenger_id: user.id,
      opponent_id: opponentMode === "open" ? null : opponentId,
      format,
      prize_pd: prizeNum,
      status: "pendiente",
    });
    setSubmitting(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "¡Desafío lanzado!", description: "Ya aparece en la Arena de Combate." });
    onOpenChange(false);
    setPrize("");
    setOpponentMode("open");
    setOpponentId("");
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card/95 border-primary/40">
        <DialogHeader>
          <DialogTitle className="font-display tracking-widest neon-text-gold">
            LANZAR DESAFÍO
          </DialogTitle>
          <DialogDescription>
            Define formato, recompensa en Pokedólares y rival.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <Label className="font-display text-xs tracking-widest">FORMATO</Label>
            <Select value={format} onValueChange={(v) => setFormat(v as ChallengeFormat)}>
              <SelectTrigger className="mt-1 bg-background/60 border-primary/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHALLENGE_FORMATS.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="font-display text-xs tracking-widest">POKEDÓLARES</Label>
            <Input
              value={prize}
              onChange={(e) => setPrize(e.target.value.replace(/[^\d]/g, ""))}
              placeholder="500000"
              className="mt-1 bg-background/60 border-primary/30"
            />
          </div>

          <div>
            <Label className="font-display text-xs tracking-widest">RIVAL</Label>
            <div className="flex gap-2 mt-2">
              <Button
                type="button"
                size="sm"
                variant={opponentMode === "open" ? "default" : "outline"}
                onClick={() => setOpponentMode("open")}
                className="flex-1 font-display text-[10px] tracking-widest"
              >
                ABIERTO
              </Button>
              <Button
                type="button"
                size="sm"
                variant={opponentMode === "target" ? "default" : "outline"}
                onClick={() => setOpponentMode("target")}
                className="flex-1 font-display text-[10px] tracking-widest"
              >
                ESPECÍFICO
              </Button>
            </div>
            {opponentMode === "target" && (
              <Select value={opponentId} onValueChange={setOpponentId}>
                <SelectTrigger className="mt-2 bg-background/60 border-primary/30">
                  <SelectValue placeholder="Elige trainer..." />
                </SelectTrigger>
                <SelectContent>
                  {rivals
                    .filter((r) => r.user_id !== user?.id)
                    .map((r) => (
                      <SelectItem key={r.user_id} value={r.user_id}>
                        {r.pokemmo_nick?.trim() || r.username}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full font-display tracking-widest bg-gradient-neon text-background"
          >
            {submitting ? <Loader2 className="animate-spin" size={16} /> : "PUBLICAR RETO"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
