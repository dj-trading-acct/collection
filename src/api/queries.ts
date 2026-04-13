import { useQuery } from "@tanstack/react-query";
import { pokemonKeys, collectionKeys } from "./queryKeys";
import { getAll, getById, getFilterOptions, getOwnerName, loadCollection } from "../store/collection";
import type { Pokemon, PokemonFilters } from "../data/types";

export function usePokemonList(filters: Partial<PokemonFilters> = {}) {
  return useQuery({
    queryKey: pokemonKeys.list(filters as Record<string, unknown>),
    queryFn: async () => {
      await loadCollection();
      return getAll(filters);
    },
    staleTime: Infinity,
  });
}

export function usePokemon(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: pokemonKeys.detail(id),
    queryFn: async () => {
      await loadCollection();
      const pokemon = getById(id);
      if (!pokemon) throw new Error(`Pokemon ${id} not found`);
      return pokemon;
    },
    staleTime: Infinity,
    enabled: options?.enabled,
  });
}

export function usePokemonFilters() {
  return useQuery({
    queryKey: pokemonKeys.filters(),
    queryFn: async () => {
      await loadCollection();
      return getFilterOptions();
    },
    staleTime: Infinity,
  });
}

export function useCollectionOwner() {
  return useQuery({
    queryKey: collectionKeys.owner(),
    queryFn: async () => {
      await loadCollection();
      return getOwnerName();
    },
    staleTime: Infinity,
  });
}
