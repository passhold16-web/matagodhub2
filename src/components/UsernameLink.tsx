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
 * Renders a real <a> via React Router's <Link>, with a generous tap target
 * and `touch-manipulation` so it works reliably on Android / iOS.
 *
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
    // Prevent parent card onClicks from intercepting navigation,
    // but DO NOT preventDefault — we want React Router to handle it.
    if (stopPropagation) e.stopPropagation();
    onBeforeNavigate?.();
  };

  return (
    <Link
      to={`/perfil/${encodeURIComponent(username)}`}
      onClick={handleClick}
      aria-label={ariaLabel ?? `Ver perfil de ${username}`}
      style={{ touchAction: "manipulation" }}
      className={`relative z-20 inline-flex items-center cursor-pointer no-underline hover:no-underline px-1 -mx-1 py-0.5 -my-0.5 rounded ${className}`}
    >
      {label}
    </Link>
  );
};
