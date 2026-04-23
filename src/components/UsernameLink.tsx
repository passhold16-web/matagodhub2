import { Link } from "react-router-dom";
import type { ReactNode, MouseEvent } from "react";

interface UsernameLinkProps {
  username?: string | null;
  children?: ReactNode;
  className?: string;
  /** Called before navigation (e.g. to close a modal). */
  onBeforeNavigate?: () => void;
  /** Stop click from bubbling to parent (cards, rows). */
  stopPropagation?: boolean;
  ariaLabel?: string;
}

/**
 * Universal username link: navigates to /perfil/:username from anywhere
 * (builds, foro, comments, tournament registrations, chat, DMs…).
 *
 * Visually neutral: inherits color, no underline, just a pointer cursor.
 * Falls back to a plain <span> if the username is missing.
 */
export const UsernameLink = ({
  username,
  children,
  className = "",
  onBeforeNavigate,
  stopPropagation = true,
  ariaLabel,
}: UsernameLinkProps) => {
  const label = children ?? username ?? "Trainer";

  if (!username) {
    return <span className={className}>{label}</span>;
  }

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (stopPropagation) e.stopPropagation();
    onBeforeNavigate?.();
  };

  return (
    <Link
      to={`/perfil/${encodeURIComponent(username)}`}
      onClick={handleClick}
      aria-label={ariaLabel ?? `Ver perfil de ${username}`}
      className={`cursor-pointer no-underline hover:no-underline ${className}`}
    >
      {label}
    </Link>
  );
};
