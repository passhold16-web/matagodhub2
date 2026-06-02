import type { ChallengeRow, ChallengeWithProfiles } from "@/types/challenges";
import { displayPokemmoNick } from "@/lib/combatStats";

export function getOpponentId(c: ChallengeRow): string | null {
  return c.opponent_id;
}

export function isOpenChallenge(c: ChallengeRow): boolean {
  return c.status === "pendiente" && c.opponent_id === null;
}

export function canReportResult(c: ChallengeRow): boolean {
  if (c.status !== "aceptado" || !c.meet_at) return false;
  return new Date() >= new Date(c.meet_at);
}

export function getCurrentStep(c: ChallengeRow): 1 | 2 | 3 | 4 {
  if (c.status === "pendiente") return 1;
  if (c.status === "aceptado" && !c.meet_confirmed_at) return 2;
  if (c.status === "aceptado" && c.meet_confirmed_at) return canReportResult(c) ? 4 : 3;
  if (c.status === "disputa") return 4;
  if (c.status === "completado" || c.status === "cancelado") return 4;
  return 1;
}

export function buildArenaHeadline(c: ChallengeWithProfiles): string {
  const a = c.challenger
    ? displayPokemmoNick(c.challenger.pokemmo_nick, c.challenger.username)
    : "???";
  if (c.status === "pendiente" && !c.opponent_id) {
    return `¡${a} lanza un desafío abierto en ${c.format} por ${c.prize_pd.toLocaleString("es-ES")}$!`;
  }
  const b = c.opponent
    ? displayPokemmoNick(c.opponent.pokemmo_nick, c.opponent.username)
    : "???";
  return `¡${a} ha desafiado a ${b} en ${c.format} por ${c.prize_pd.toLocaleString("es-ES")}$!`;
}

export function buildSpectatorAnnouncement(c: ChallengeWithProfiles): string | null {
  if (!c.meet_confirmed_at || !c.meet_day || !c.meet_time) return null;
  const a = c.challenger
    ? displayPokemmoNick(c.challenger.pokemmo_nick, c.challenger.username)
    : "???";
  const b = c.opponent
    ? displayPokemmoNick(c.opponent.pokemmo_nick, c.opponent.username)
    : "???";
  return `${a} VS ${b} — ${c.meet_day} ${String(c.meet_time).slice(0, 5)} (${c.meet_timezone}), Canal ${c.meet_channel}, ${c.meet_city}`;
}

export const TIMEZONE_OPTIONS = [
  "España (CET/CEST)",
  "México (CST)",
  "Argentina (ART)",
  "Chile (CLT)",
  "Colombia (COT)",
  "Perú (PET)",
  "Brasil (BRT)",
  "UTC",
  "Otro",
];
