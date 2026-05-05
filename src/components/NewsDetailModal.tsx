import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pin, Calendar } from "lucide-react";
import { UsernameLink } from "./UsernameLink";

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  image_url: string | null;
  pinned: boolean;
  created_at: string;
  author_username?: string | null;
  author_role?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  item: NewsItem | null;
}

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return `[${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}]`;
};

export const NewsDetailModal = ({ open, onOpenChange, item }: Props) => {
  if (!item) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-primary/40 max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-xs font-display tracking-widest text-foreground/50 mb-2">
            {item.pinned && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/40">
                <Pin size={10} /> DESTACADA
              </span>
            )}
            <Calendar size={11} />
            {formatDate(item.created_at)}
          </div>
          <DialogTitle className="font-display text-2xl md:text-3xl tracking-wider neon-text-gold leading-tight">
            {item.title}
          </DialogTitle>
        </DialogHeader>

        {item.image_url && (
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full max-h-72 object-cover rounded-md border border-primary/20"
          />
        )}

        <p className="text-foreground/80 text-base leading-relaxed">{item.summary}</p>
        {item.content && (
          <p className="text-foreground/70 text-sm leading-relaxed whitespace-pre-wrap">{item.content}</p>
        )}

        {item.author_username && (
          <div className="text-xs font-display tracking-widest text-foreground/50 pt-2 border-t border-border/50">
            POR{" "}
            <UsernameLink
              username={item.author_username}
              className="text-primary hover:text-primary/80"
              onBeforeNavigate={() => onOpenChange(false)}
            />
            {item.author_role && item.author_role !== "user" && (
              <span className="ml-1 text-accent uppercase">· {item.author_role}</span>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
