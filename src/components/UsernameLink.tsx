import { Link } from "react-router-dom";
import type { ReactNode, MouseEvent, TouchEvent } from "react";

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
 *
 * Stops mouse / touch / pointer events on multiple phases so a parent
 * card with onClick (e.g. forum post tile) cannot steal the click.
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

  const stopAll = (e: MouseEvent | TouchEvent) => {
    if (stopPropagation) e.stopPropagation();
  };

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (stopPropagation) e.stopPropagation();
    onBeforeNavigate?.();
  };

  return (
    <Link
      to={`/perfil/${encodeURIComponent(username)}`}
      onClick={handleClick}
      onMouseDown={stopAll}
      onTouchStart={stopAll}
      aria-label={ariaLabel ?? `Ver perfil de ${username}`}
      className={`relative z-10 cursor-pointer no-underline hover:no-underline ${className}`}
    >
      {label}
    </Link>
  );
};
