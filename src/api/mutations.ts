import { useMutation, useQueryClient } from '@tanstack/react-query';
import { pokemonKeys } from './queryKeys';
import { create, update, remove, removeByTag, loadCollection, getById, bulkRemove } from '../store/collection';
import { addChange } from '../store/pendingChanges';
import type { Pokemon, CreatePokemon, UpdatePokemon } from '../data/types';

export function useCreatePokemon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePokemon): Promise<Pokemon> => {
      await loadCollection();
      const pokemon = create(data);
      addChange({ type: 'add', pokemon });
      return pokemon;
    },
    onSettled: () => {
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: pokemonKeys.all() }),
      ]);
    },
  });
}

export function useUpdatePokemon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdatePokemon }): Promise<Pokemon> => {
      await loadCollection();
      const previous = getById(id);
      const pokemon = update(id, data);
      addChange({ type: 'update', pokemon, previous });
      return pokemon;
    },
    onSettled: () => {
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: pokemonKeys.all() }),
      ]);
    },
  });
}

export function useDeletePokemon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await loadCollection();
      const pokemon = getById(id);
      remove(id);
      if (pokemon) {
        addChange({ type: 'delete', pokemon });
      }
    },
    onSettled: () => {
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: pokemonKeys.all() }),
      ]);
    },
  });
}

export function useBulkUpdatePokemon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ids, data }: { ids: string[]; data: UpdatePokemon }): Promise<Pokemon[]> => {
      await loadCollection();
      const updated: Pokemon[] = [];
      for (const id of ids) {
        const previous = getById(id);
        if (!previous) continue;
        // Skip if all provided fields already match
        const dominated = Object.entries(data).every(
          ([k, v]) => v === undefined || (previous as Record<string, unknown>)[k] === v,
        );
        if (dominated) continue;
        const pokemon = update(id, data);
        addChange({ type: 'update', pokemon, previous });
        updated.push(pokemon);
      }
      return updated;
    },
    onSettled: () => {
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: pokemonKeys.all() }),
      ]);
    },
  });
}

export function useBulkDeletePokemon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]): Promise<void> => {
      await loadCollection();
      const removed = bulkRemove(ids);
      for (const pokemon of removed) {
        addChange({ type: 'delete', pokemon });
      }
    },
    onSettled: () => {
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: pokemonKeys.all() }),
      ]);
    },
  });
}

export function useBulkAddTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ids, tag }: { ids: string[]; tag: string }): Promise<Pokemon[]> => {
      await loadCollection();
      const updated: Pokemon[] = [];
      for (const id of ids) {
        const previous = getById(id);
        if (!previous) continue;
        const currentTags = previous.tags ?? [];
        if (!currentTags.includes(tag)) {
          const pokemon = update(id, { tags: [...currentTags, tag] });
          addChange({ type: 'update', pokemon, previous });
          updated.push(pokemon);
        }
      }
      return updated;
    },
    onSettled: () => {
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: pokemonKeys.all() }),
      ]);
    },
  });
}

export function useBulkRemoveTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ids, tag }: { ids: string[]; tag: string }): Promise<Pokemon[]> => {
      await loadCollection();
      const updated: Pokemon[] = [];
      for (const id of ids) {
        const previous = getById(id);
        if (!previous) continue;
        const currentTags = previous.tags ?? [];
        if (currentTags.includes(tag)) {
          const pokemon = update(id, { tags: currentTags.filter((t) => t !== tag) });
          addChange({ type: 'update', pokemon, previous });
          updated.push(pokemon);
        }
      }
      return updated;
    },
    onSettled: () => {
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: pokemonKeys.all() }),
      ]);
    },
  });
}

export function useDeleteByTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tag: string): Promise<void> => {
      await loadCollection();
      const removed = removeByTag(tag);
      for (const pokemon of removed) {
        addChange({ type: 'delete', pokemon });
      }
    },
    onSettled: () => {
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: pokemonKeys.all() }),
      ]);
    },
  });
}
