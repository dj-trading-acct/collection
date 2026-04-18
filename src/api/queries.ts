import { useCallback } from "react";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { pokemonKeys, collectionKeys } from "./queryKeys";
import { getAllRaw, getFilterOptions, getOwnerName, getTrainerProfiles, loadCollection, matchesFilters, sortPokemon } from "../store/collection";
import type { Pokemon, PokemonFilters } from "../data/types";

const allPokemonOptions = queryOptions({
  queryKey: pokemonKeys.list(),
  queryFn: async () => {
    await loadCollection();
    return getAllRaw();
  },
  staleTime: Infinity,
});

export function usePokemonList(filters: Partial<PokemonFilters>) {
  const select = useCallback(
    (pokemon: Pokemon[]) => {
      const filtered = pokemon.filter((p) => matchesFilters(p, filters));
      return sortPokemon(filtered, filters.sort_by, filters.sort_order);
    },
    [filters],
  );
  return useQuery({ ...allPokemonOptions, select });
}

export function usePokemon(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    ...allPokemonOptions,
    select: (pokemon) => pokemon.find((p) => p.id === id),
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

export function useTrainerProfiles() {
  return useQuery({
    queryKey: pokemonKeys.trainerProfiles(),
    queryFn: async () => {
      await loadCollection();
      return getTrainerProfiles();
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
