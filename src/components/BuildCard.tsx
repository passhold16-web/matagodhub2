import { Heart, Eye, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Build } from "@/data/mockBuilds";
import { PokemonSprite } from "./PokemonSprite";
import { AuthorBadge } from "./AuthorBadge";
import { useAuth } from "@/hooks/useAuth";
import { useBuildVote } from "@/hooks/useBuildVote";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface BuildCardProps {
  build: Build;
  buildId: string;
  ownerId: string;
  authorRole?: string | null;
  onOpen?: () => void;
  onEdit?: () => void;
  onDeleted?: () => void;
}

export const BuildCard = ({
  build,
  buildId,
  ownerId,
  authorRole,
  onOpen,
  onEdit,
  onDeleted,
}: BuildCardProps) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { voted, count, toggle, busy } = useBuildVote(buildId, build.votes);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOwner = user?.id === ownerId;
  const isStaff = profile?.role === "admin" || profile?.role === "mod";
  const canEdit = isOwner || isStaff;
  const canDelete = isOwner || isStaff;

  const handleDelete = async () => {
    setDeleting(true);
    const { error } = await supabase.from("builds").delete().eq("id", buildId);
    setDeleting(false);
    setConfirmOpen(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Build eliminada", description: "Tu equipo ha sido borrado." });
    onDeleted?.();
  };

  return (
    <>
      <article
        onClick={(e) => {
          // Only fire when the click originated on the card itself, not on a
          // nested button / link / anchor (Heart vote, dropdown, username…).
          const target = e.target as HTMLElement;
          if (target.closest("button, a, [role='menuitem']")) return;
          onOpen?.();
        }}
        className="neon-border bg-card/80 backdrop-blur-xl p-5 rounded-lg group transition-transform hover:-translate-y-1 duration-300 cursor-pointer relative"
      >
        <header className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0">
            <h3 className="font-display text-lg font-bold tracking-wide text-foreground group-hover:neon-text-red transition-all truncate">
              {build.name}
            </h3>
            <AuthorBadge
              username={build.author}
              role={authorRole}
              className="mt-1"
            />
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className={`tier-badge tier-${build.tier}`}>{build.tier}</span>
            {canEdit && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <button
                    aria-label="Acciones"
                    className="p-1 rounded hover:bg-primary/10 text-foreground/60 hover:text-foreground transition-colors"
                  >
                    <MoreVertical size={14} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  onClick={(e) => e.stopPropagation()}
                  className="bg-card/95 backdrop-blur-xl border-primary/30"
                >
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit?.();
                    }}
                    className="cursor-pointer"
                  >
                    <Pencil size={12} className="mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmOpen(true);
                    }}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <Trash2 size={12} className="mr-2" />
                    Borrar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>

        <p className="text-sm text-foreground/70 mb-4 line-clamp-2 min-h-[2.5rem]">
          {build.description}
        </p>

        <div className="grid grid-cols-6 gap-1 p-2 rounded-md bg-background/60 border border-primary/10 mb-4">
          {build.pokemonIds.map((id, idx) => (
            <div
              key={`${buildId}-${id}-${idx}`}
              className="aspect-square flex items-center justify-center rounded bg-muted/30 hover:bg-primary/10 transition-colors"
            >
              <PokemonSprite id={id} size={48} />
            </div>
          ))}
        </div>

        <footer className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <button
              type="button"
              disabled={busy}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                void toggle();
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              style={{ touchAction: "manipulation" }}
              className={`flex items-center gap-1 group/vote transition-colors p-1 -m-1 ${
                voted ? "text-primary" : "hover:text-primary"
              }`}
              aria-label={voted ? "Quitar voto" : "Votar"}
            >
              <Heart
                size={14}
                className={`transition-all ${
                  voted
                    ? "fill-primary text-primary drop-shadow-[0_0_6px_hsl(var(--primary))]"
                    : "text-primary group-hover/vote:scale-110"
                }`}
              />
              <span className="font-display">{count.toLocaleString()}</span>
            </button>
            <span className="flex items-center gap-1">
              <Eye size={14} className="text-accent" />
              <span className="font-display">{build.views.toLocaleString()}</span>
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpen?.();
            }}
            className="font-display tracking-wider text-primary hover:text-accent transition-colors"
          >
            VER →
          </button>
        </footer>
      </article>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="glass-strong border-destructive/40">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display tracking-wider neon-text-red">
              ¿Borrar esta build?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Tu equipo se eliminará para siempre.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Borrando..." : "Borrar definitivamente"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
