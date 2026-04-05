import { z } from "zod";
import {
  pokemonSchema,
  createPokemonSchema,
  updatePokemonSchema,
  pokemonFiltersSchema,
} from "./schemas";

export type Pokemon = z.infer<typeof pokemonSchema>;
export type CreatePokemon = z.infer<typeof createPokemonSchema>;
export type UpdatePokemon = z.infer<typeof updatePokemonSchema>;
export type PokemonFilters = z.infer<typeof pokemonFiltersSchema>;
