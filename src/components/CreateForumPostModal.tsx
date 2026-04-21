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
import { FORUM_CATEGORIES, type ForumCategoryId } from "@/data/forumMeta";
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  defaultCategory: ForumCategoryId;
  onCreated: () => void;
}

export const CreateForumPostModal = ({
  open,
  onOpenChange,
  defaultCategory,
  onCreated,
}: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [category, setCategory] = useState<ForumCategoryId>(defaultCategory);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) setCategory(defaultCategory);
  }, [open, defaultCategory]);

  useEffect(() => {
    if (!open) {
      setTitle("");
      setContent("");
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!user) return;
    const t = title.trim();
    const c = content.trim();
    if (t.length < 3 || t.length > 120) {
      toast({
        title: "Título inválido",
        description: "Entre 3 y 120 caracteres.",
        variant: "destructive",
      });
      return;
    }
    if (c.length < 1 || c.length > 5000) {
      toast({
        title: "Contenido inválido",
        description: "Entre 1 y 5000 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("forum_posts").insert({
      user_id: user.id,
      category,
      title: t,
      content: c,
    });
    setSubmitting(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Post publicado" });
    onOpenChange(false);
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-primary/40 max-w-xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl tracking-wider neon-text-gold">
            NUEVO POST
          </DialogTitle>
          <DialogDescription className="text-foreground/60">
            Comparte algo con la comunidad MATAGOD.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <label className="font-display text-xs tracking-widest text-foreground/70 mb-1 block">
              CATEGORÍA
            </label>
            <div className="flex gap-2 flex-wrap">
              {FORUM_CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className={`px-3 py-1.5 rounded-md font-display text-xs tracking-widest border transition-all ${
                    category === c.id
                      ? "bg-primary text-primary-foreground border-primary shadow-[0_0_15px_hsl(var(--primary)/0.4)]"
                      : "bg-card/40 text-foreground/60 border-border hover:border-primary/50"
                  }`}
                >
                  {c.label.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-display text-xs tracking-widest text-foreground/70 mb-1 block">
              TÍTULO
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 120))}
              placeholder="¿Cómo counterear a Garchomp en OU?"
              className="bg-background/60 border-primary/30 focus:border-primary font-display tracking-wide"
            />
            <p className="text-[10px] text-foreground/40 mt-1">{title.length}/120</p>
          </div>

          <div>
            <label className="font-display text-xs tracking-widest text-foreground/70 mb-1 block">
              CONTENIDO
            </label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, 5000))}
              rows={8}
              placeholder="Desarrolla tu idea..."
              className="bg-background/60 border-primary/30 focus:border-primary resize-none"
            />
            <p className="text-[10px] text-foreground/40 mt-1">{content.length}/5000</p>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full font-display tracking-[0.3em] bg-gradient-neon text-background hover:opacity-90 shadow-[0_0_20px_hsl(var(--primary)/0.4)]"
          >
            {submitting ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
            PUBLICAR POST
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
