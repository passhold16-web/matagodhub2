import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { categoryLabel } from "@/data/forumMeta";
import type { ForumPostRow } from "@/pages/Foro";
import { Heart, Loader2, Send, Trash2 } from "lucide-react";
import { UsernameLink } from "@/components/UsernameLink";

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  likes_count: number;
  created_at: string;
  author?: { username: string; role: string } | null;
}

interface Props {
  post: ForumPostRow | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onChanged: () => void;
}

export const ForumPostDetailModal = ({
  post,
  open,
  onOpenChange,
  onChanged,
}: Props) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Likes state: map of `${type}:${id}` -> own like row id (or null if not liked)
  const [postLiked, setPostLiked] = useState<string | null>(null);
  const [postLikesCount, setPostLikesCount] = useState(0);
  const [commentLikes, setCommentLikes] = useState<Record<string, string | null>>({});
  const [commentLikesCount, setCommentLikesCount] = useState<Record<string, number>>({});

  const lastSentRef = useRef(0);
  const isStaff =
    profile?.role?.toLowerCase() === "admin" ||
    profile?.role?.toLowerCase() === "mod";

  useEffect(() => {
    if (!open || !post) return;
    setPostLikesCount(post.likes_count);
    void load(post.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, post?.id]);

  const load = async (postId: string) => {
    setLoading(true);
    const [commentsRes, likesRes] = await Promise.all([
      supabase
        .from("forum_comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true }),
      user
        ? supabase
            .from("forum_likes")
            .select("id, target_type, target_id")
            .eq("user_id", user.id)
        : Promise.resolve({ data: [] as { id: string; target_type: string; target_id: string }[] }),
    ]);

    const rows = (commentsRes.data ?? []) as Comment[];
    if (rows.length > 0) {
      const ids = Array.from(new Set(rows.map((r) => r.user_id)));
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, username, role")
        .in("user_id", ids);
      const map = new Map(
        (profs ?? []).map((p) => [p.user_id, { username: p.username, role: p.role }])
      );
      rows.forEach((r) => (r.author = map.get(r.user_id) ?? null));
    }
    setComments(rows);
    setCommentLikesCount(
      Object.fromEntries(rows.map((r) => [r.id, r.likes_count]))
    );

    const myLikes = (likesRes.data ?? []) as {
      id: string;
      target_type: string;
      target_id: string;
    }[];
    const cMap: Record<string, string | null> = {};
    let pLike: string | null = null;
    myLikes.forEach((l) => {
      if (l.target_type === "post" && l.target_id === postId) pLike = l.id;
      if (l.target_type === "comment") cMap[l.target_id] = l.id;
    });
    setPostLiked(pLike);
    setCommentLikes(cMap);
    setLoading(false);
  };

  // Realtime: comments stream for this post
  useEffect(() => {
    if (!open || !post) return;
    const channel = supabase
      .channel(`forum_post_${post.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "forum_comments",
          filter: `post_id=eq.${post.id}`,
        },
        () => void load(post.id)
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, post?.id, user?.id]);

  const requireLogin = () => {
    if (!user) {
      onOpenChange(false);
      navigate("/auth");
      return false;
    }
    return true;
  };

  const togglePostLike = async () => {
    if (!post || !requireLogin()) return;
    if (postLiked) {
      const id = postLiked;
      setPostLiked(null);
      setPostLikesCount((n) => Math.max(0, n - 1));
      const { error } = await supabase.from("forum_likes").delete().eq("id", id);
      if (error) {
        setPostLiked(id);
        setPostLikesCount((n) => n + 1);
      }
    } else {
      setPostLikesCount((n) => n + 1);
      const { data, error } = await supabase
        .from("forum_likes")
        .insert({
          user_id: user!.id,
          target_type: "post",
          target_id: post.id,
        })
        .select("id")
        .single();
      if (error || !data) {
        setPostLikesCount((n) => Math.max(0, n - 1));
      } else {
        setPostLiked(data.id);
      }
    }
    onChanged();
  };

  const toggleCommentLike = async (commentId: string) => {
    if (!requireLogin()) return;
    const existing = commentLikes[commentId];
    if (existing) {
      setCommentLikes((m) => ({ ...m, [commentId]: null }));
      setCommentLikesCount((m) => ({ ...m, [commentId]: Math.max(0, (m[commentId] ?? 0) - 1) }));
      const { error } = await supabase.from("forum_likes").delete().eq("id", existing);
      if (error) {
        setCommentLikes((m) => ({ ...m, [commentId]: existing }));
        setCommentLikesCount((m) => ({ ...m, [commentId]: (m[commentId] ?? 0) + 1 }));
      }
    } else {
      setCommentLikesCount((m) => ({ ...m, [commentId]: (m[commentId] ?? 0) + 1 }));
      const { data, error } = await supabase
        .from("forum_likes")
        .insert({
          user_id: user!.id,
          target_type: "comment",
          target_id: commentId,
        })
        .select("id")
        .single();
      if (error || !data) {
        setCommentLikesCount((m) => ({ ...m, [commentId]: Math.max(0, (m[commentId] ?? 0) - 1) }));
      } else {
        setCommentLikes((m) => ({ ...m, [commentId]: data.id }));
      }
    }
  };

  const submitComment = async () => {
    if (!post || !requireLogin()) return;
    const t = text.trim();
    if (!t) return;
    if (t.length > 1500) {
      toast({
        title: "Comentario demasiado largo",
        description: "Máx. 1500 caracteres.",
        variant: "destructive",
      });
      return;
    }
    const now = Date.now();
    if (now - lastSentRef.current < 2000) {
      toast({ title: "Espera un momento", description: "2 segundos entre comentarios." });
      return;
    }
    setSubmitting(true);
    lastSentRef.current = now;
    const { error } = await supabase.from("forum_comments").insert({
      post_id: post.id,
      user_id: user!.id,
      content: t,
    });
    setSubmitting(false);
    if (error) {
      lastSentRef.current = 0;
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setText("");
    onChanged();
  };

  const deleteComment = async (c: Comment) => {
    if (!confirm("¿Borrar este comentario?")) return;
    const { error } = await supabase.from("forum_comments").delete().eq("id", c.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    onChanged();
  };

  const roleColor = (role?: string) => {
    const r = role?.toLowerCase();
    if (r === "admin" || r === "mod") return "text-accent";
    if (r === "youtuber") return "text-primary";
    return "neon-text-gold";
  };

  if (!post) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-primary/40 max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <span className="font-display text-[10px] tracking-widest px-2 py-0.5 rounded border border-accent/40 text-accent bg-accent/10 self-start">
            {categoryLabel(post.category).toUpperCase()}
          </span>
          <DialogTitle className="font-display text-xl md:text-2xl tracking-wider text-foreground mt-2">
            {post.title}
          </DialogTitle>
          <UsernameLink
            username={post.author?.username}
            onBeforeNavigate={() => onOpenChange(false)}
            className={`font-display text-xs tracking-widest text-left ${roleColor(
              post.author?.role
            )}`}
          >
            POR {post.author?.username?.toUpperCase() ?? "TRAINER"}
          </UsernameLink>
        </DialogHeader>

        <div className="mt-2 space-y-4">
          <p className="text-sm text-foreground/85 whitespace-pre-wrap">
            {post.content}
          </p>

          <div className="flex items-center gap-3 border-y border-primary/15 py-2">
            <button
              onClick={togglePostLike}
              className={`inline-flex items-center gap-1.5 text-xs font-display tracking-widest transition-colors ${
                postLiked ? "text-primary" : "text-foreground/60 hover:text-primary"
              }`}
            >
              <Heart
                size={14}
                className={postLiked ? "fill-primary" : ""}
              />
              {postLikesCount}
            </button>
            <span className="text-xs text-foreground/40 font-display tracking-widest">
              {comments.length} COMENTARIOS
            </span>
          </div>

          {/* Comments list */}
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 size={20} className="animate-spin text-primary" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-center text-foreground/50 text-sm py-4">
              Aún no hay comentarios. Empieza la conversación.
            </p>
          ) : (
            <div className="space-y-3">
              {comments.map((c) => {
                const own = user?.id === c.user_id;
                const canDelete = own || isStaff;
                const liked = !!commentLikes[c.id];
                return (
                  <div
                    key={c.id}
                    className="bg-card/40 border border-border rounded-md p-3 group"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <UsernameLink
                        username={c.author?.username}
                        onBeforeNavigate={() => onOpenChange(false)}
                        className={`font-display text-[11px] tracking-widest ${roleColor(
                          c.author?.role
                        )}`}
                      >
                        {c.author?.username ?? "Trainer"}
                      </UsernameLink>
                      {canDelete && (
                        <button
                          onClick={() => deleteComment(c)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                          aria-label="Borrar comentario"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-foreground/85 whitespace-pre-wrap break-words mb-2">
                      {c.content}
                    </p>
                    <button
                      onClick={() => toggleCommentLike(c.id)}
                      className={`inline-flex items-center gap-1 text-[11px] font-display tracking-widest transition-colors ${
                        liked ? "text-primary" : "text-foreground/50 hover:text-primary"
                      }`}
                    >
                      <Heart size={11} className={liked ? "fill-primary" : ""} />
                      {commentLikesCount[c.id] ?? 0}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* New comment */}
          {user ? (
            <div className="flex items-end gap-2 pt-2 border-t border-primary/15">
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, 1500))}
                rows={2}
                placeholder="Escribe un comentario..."
                className="bg-background/60 border-primary/30 focus:border-primary resize-none flex-1"
              />
              <Button
                onClick={submitComment}
                disabled={submitting || !text.trim()}
                className="font-display tracking-widest bg-gradient-neon text-background hover:opacity-90"
                aria-label="Enviar comentario"
              >
                {submitting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
              </Button>
            </div>
          ) : (
            <div className="text-center pt-2 border-t border-primary/15">
              <Button
                onClick={() => {
                  onOpenChange(false);
                  navigate("/auth");
                }}
                size="sm"
                className="font-display tracking-widest bg-gradient-neon text-background"
              >
                INICIAR SESIÓN PARA COMENTAR
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
