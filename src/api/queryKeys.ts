export const pokemonKeys = {
  all: () => ["pokemon"] as const,
  list: () => [...pokemonKeys.all(), "list"] as const,
  filters: () => [...pokemonKeys.all(), "filters"] as const,
  trainerProfiles: () => [...pokemonKeys.all(), "trainer-profiles"] as const,
};

export const collectionKeys = {
  all: ["collection"] as const,
  owner: () => [...collectionKeys.all, "owner"] as const,
};
