import { render, type RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement, ReactNode } from "react";
import type { Pokemon } from "../data/types";

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

export function createWrapper(queryClient?: QueryClient) {
  const client = queryClient ?? createQueryClient();
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper"> & { queryClient?: QueryClient },
) {
  const { queryClient, ...renderOptions } = options ?? {};
  return render(ui, {
    wrapper: createWrapper(queryClient),
    ...renderOptions,
  });
}

export function createTestPokemon(overrides: Partial<Pokemon> = {}): Pokemon {
  return {
    id: "test",
    species: "Pikachu",
    dex_number: 25,
    form: null,
    nickname: null,
    gender: null,
    level: 50,
    nature: "Hardy",
    ability: "Static",
    is_hidden_ability: false,
    ot_name: "Ash",
    ot_tid: "12345",
    language_tag: "ENG",
    origin_mark: "Paldea",
    current_location: "Box 1",
    is_shiny: false,
    is_event: false,
    is_alpha: false,
    is_available_for_trade: false,
    poke_ball: "Poke Ball",
    ribbons: [],
    marks: [],
    tags: [],
    notes: null,
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}
