export const pokemonKeys = {
  all: ["pokemon"] as const,
  lists: () => [...pokemonKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...pokemonKeys.lists(), filters] as const,
  details: () => [...pokemonKeys.all, "detail"] as const,
  detail: (id: string) => [...pokemonKeys.details(), id] as const,
  filters: () => [...pokemonKeys.all, "filters"] as const,
};

export const collectionKeys = {
  all: ["collection"] as const,
  owner: () => [...collectionKeys.all, "owner"] as const,
};
