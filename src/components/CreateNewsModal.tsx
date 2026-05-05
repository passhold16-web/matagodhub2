import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Pin } from "lucide-react";

interface NewsRecord {
  id: string;
  title: string;
  summary: string;
  content: string;
  image_url: string | null;
  pinned: boolean;
  published: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing?: NewsRecord | null;
  onSaved: () => void;
}

export const CreateNewsModal = ({ open, onOpenChange, editing, onSaved }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [pinned, setPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(editing?.title ?? "");
      setSummary(editing?.summary ?? "");
      setContent(editing?.content ?? "");
      setImageUrl(editing?.image_url ?? "");
      setPinned(editing?.pinned ?? false);
    }
  }, [open, editing]);

  const handleSubmit = async () => {
    if (!user) return;
    const t = title.trim();
    const s = summary.trim();
    if (t.length < 3 || t.length > 120) {
      toast({ title: "Título inválido", description: "Entre 3 y 120 caracteres.", variant: "destructive" });
      return;
    }
    if (s.length < 3 || s.length > 200) {
      toast({ title: "Resumen inválido", description: "Entre 3 y 200 caracteres.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const payload = {
      title: t,
      summary: s,
      content: content.trim(),
      image_url: imageUrl.trim() || null,
      pinned,
      published: true,
    };
    const { error } = editing
      ? await supabase.from("news").update(payload).eq("id", editing.id)
      : await supabase.from("news").insert({ ...payload, user_id: user.id });
    setSubmitting(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: editing ? "Noticia actualizada" : "Noticia publicada" });
    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-primary/40 max-w-xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl tracking-wider neon-text-gold">
            {editing ? "EDITAR NOTICIA" : "NUEVA NOTICIA"}
          </DialogTitle>
          <DialogDescription className="text-foreground/60">
            Solo visible para staff. Aparece en el banner de inicio.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <label className="font-display text-xs tracking-widest text-foreground/70 mb-1 block">TÍTULO</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 120))}
              placeholder="Nuevo torneo OU este sábado"
              className="bg-background/60 border-primary/30 focus:border-primary font-display tracking-wide"
            />
            <p className="text-[10px] text-foreground/40 mt-1">{title.length}/120</p>
          </div>

          <div>
            <label className="font-display text-xs tracking-widest text-foreground/70 mb-1 block">RESUMEN (1 línea)</label>
            <Input
              value={summary}
              onChange={(e) => setSummary(e.target.value.slice(0, 200))}
              placeholder="Inscripciones abiertas. Premio: 500k."
              className="bg-background/60 border-primary/30 focus:border-primary"
            />
            <p className="text-[10px] text-foreground/40 mt-1">{summary.length}/200</p>
          </div>

          <div>
            <label className="font-display text-xs tracking-widest text-foreground/70 mb-1 block">CONTENIDO COMPLETO (opcional)</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, 5000))}
              rows={6}
              placeholder="Detalles, reglas, enlaces..."
              className="bg-background/60 border-primary/30 focus:border-primary resize-none"
            />
            <p className="text-[10px] text-foreground/40 mt-1">{content.length}/5000</p>
          </div>

          <div>
            <label className="font-display text-xs tracking-widest text-foreground/70 mb-1 block">IMAGEN URL (opcional)</label>
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="bg-background/60 border-primary/30 focus:border-primary"
            />
          </div>

          <button
            type="button"
            onClick={() => setPinned(!pinned)}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md font-display text-xs tracking-widest border transition-all ${
              pinned
                ? "bg-primary text-primary-foreground border-primary shadow-[0_0_15px_hsl(var(--primary)/0.4)]"
                : "bg-card/40 text-foreground/60 border-border hover:border-primary/50"
            }`}
          >
            <Pin size={14} />
            {pinned ? "DESTACADA" : "DESTACAR NOTICIA"}
          </button>

          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full font-display tracking-[0.3em] bg-gradient-neon text-background hover:opacity-90 shadow-[0_0_20px_hsl(var(--primary)/0.4)]"
          >
            {submitting ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
            {editing ? "GUARDAR CAMBIOS" : "PUBLICAR NOTICIA"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
