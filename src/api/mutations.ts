import { useMutation, useQueryClient } from '@tanstack/react-query';
import { pokemonKeys } from './queryKeys';
import { create, update, remove, loadCollection } from '../store/collection';
import type { Pokemon, CreatePokemon, UpdatePokemon } from '../data/types';

export function useCreatePokemon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePokemon): Promise<Pokemon> => {
      await loadCollection();
      return create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pokemonKeys.lists() });
      queryClient.invalidateQueries({ queryKey: pokemonKeys.filters() });
    },
  });
}

export function useUpdatePokemon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdatePokemon }): Promise<Pokemon> => {
      await loadCollection();
      return update(id, data);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: pokemonKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: pokemonKeys.lists() });
      queryClient.invalidateQueries({ queryKey: pokemonKeys.filters() });
    },
  });
}

export function useDeletePokemon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await loadCollection();
      remove(id);
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: pokemonKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: pokemonKeys.lists() });
      queryClient.invalidateQueries({ queryKey: pokemonKeys.filters() });
    },
  });
}
