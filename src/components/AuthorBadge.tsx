import { Crown, Youtube, ShieldCheck } from "lucide-react";

interface Props {
  username: string;
  role?: string | null;
  className?: string;
}

const ROLE_META: Record<
  string,
  { label: string; icon: typeof Crown; tone: string }
> = {
  admin: { label: "ADMIN", icon: ShieldCheck, tone: "text-accent border-accent/60 bg-accent/10" },
  youtuber: { label: "YT", icon: Youtube, tone: "text-primary border-primary/60 bg-primary/10" },
  mod: { label: "MOD", icon: Crown, tone: "text-accent border-accent/60 bg-accent/10" },
};

export const AuthorBadge = ({ username, role, className = "" }: Props) => {
  const meta = role ? ROLE_META[role.toLowerCase()] : undefined;
  const Icon = meta?.icon;
  const isSpecial = !!meta;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-body text-xs ${className}`}
    >
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
    </span>
  );
};
