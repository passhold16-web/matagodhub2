import { Crown, Youtube, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";


interface Props {
  username: string;
  role?: string | null;
  className?: string;
  /** When true, renders without a link (e.g. inside the profile page itself). */
  noLink?: boolean;
}

const ROLE_META: Record<
  string,
  { label: string; icon: typeof Crown; tone: string }
> = {
  admin: { label: "ADMIN", icon: ShieldCheck, tone: "text-accent border-accent/60 bg-accent/10" },
  youtuber: { label: "YT", icon: Youtube, tone: "text-primary border-primary/60 bg-primary/10" },
  mod: { label: "MOD", icon: Crown, tone: "text-accent border-accent/60 bg-accent/10" },
};

export const AuthorBadge = ({ username, role, className = "", noLink = false }: Props) => {
  const meta = role ? ROLE_META[role.toLowerCase()] : undefined;
  const Icon = meta?.icon;
  const isSpecial = !!meta;

  const stop = (e: { stopPropagation: () => void }) => e.stopPropagation();

  const inner = (
    <>
      <span className="text-foreground/50">Por:</span>
      <span
        className={`font-display tracking-wide ${
          isSpecial ? "text-accent neon-text-gold" : "text-accent"
        }`}
      >
        {username}
      </span>
      {meta && Icon && (
        <span
          className={`inline-flex items-center gap-0.5 px-1.5 py-px rounded-sm border text-[9px] font-display tracking-widest ${meta.tone}`}
        >
          <Icon size={9} />
          {meta.label}
        </span>
      )}
    </>
  );

  if (noLink) {
    return (
      <span className={`inline-flex items-center gap-1.5 font-body text-xs ${className}`}>
        {inner}
      </span>
    );
  }

  return (
    <Link
      to={`/perfil/${encodeURIComponent(username)}`}
      onClick={stop}
      onMouseDown={stop}
      onTouchStart={stop}
      style={{ touchAction: "manipulation" }}
      aria-label={`Ver perfil de ${username}`}
      className={`relative z-20 inline-flex items-center gap-1.5 font-body text-xs no-underline hover:no-underline px-1 -mx-1 py-0.5 -my-0.5 rounded hover:bg-primary/5 ${className}`}
    >
      {inner}
    </Link>
  );
};
