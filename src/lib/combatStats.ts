export function computeWinRate(wins: number, losses: number): number {
  const total = wins + losses;
  if (total === 0) return 0;
  return Math.round((wins / total) * 1000) / 10;
}

export function formatWinRate(wins: number, losses: number): string {
  return `${computeWinRate(wins, losses)}%`;
}

export function formatPrizePd(amount: number): string {
  return new Intl.NumberFormat("es-ES").format(amount) + "$";
}

export function displayPokemmoNick(
  pokemmoNick: string | null | undefined,
  username: string
): string {
  const nick = pokemmoNick?.trim();
  return nick && nick.length > 0 ? nick : username;
}
