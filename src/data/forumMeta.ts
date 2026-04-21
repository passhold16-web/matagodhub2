// Forum shared metadata
export const FORUM_CATEGORIES = [
  { id: "estrategia", label: "Estrategia", description: "Builds, sinergias, counters." },
  { id: "pve", label: "PvE", description: "Hordas, EV training, Safari, lore." },
  { id: "eventos", label: "Eventos", description: "Anuncios oficiales y comunitarios." },
  { id: "offtopic", label: "Off-topic", description: "Cualquier otra charla." },
] as const;

export type ForumCategoryId = (typeof FORUM_CATEGORIES)[number]["id"];

export const categoryLabel = (id: string): string =>
  FORUM_CATEGORIES.find((c) => c.id === id)?.label ?? id;
