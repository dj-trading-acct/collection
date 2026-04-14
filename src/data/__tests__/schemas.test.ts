import { describe, it, expect } from "vitest";
import {
  pokemonSchema,
  createPokemonSchema,
  updatePokemonSchema,
  pokemonFiltersSchema,
} from "../schemas";

describe("pokemonSchema", () => {
  const validPokemon = {
    id: "abc1",
    species: "Pikachu",
    dex_number: 25,
  };

  it("valid complete pokemon passes", () => {
    const result = pokemonSchema.safeParse({
      ...validPokemon,
      level: 50,
      is_shiny: true,
      tags: ["starter"],
    });
    expect(result.success).toBe(true);
  });

  it("required fields enforced", () => {
    expect(pokemonSchema.safeParse({}).success).toBe(false);
    expect(pokemonSchema.safeParse({ species: "Pikachu" }).success).toBe(false);
    expect(pokemonSchema.safeParse({ id: "x", dex_number: 1 }).success).toBe(false);
  });

  it("defaults applied (is_shiny, ribbons, tags)", () => {
    const result = pokemonSchema.parse(validPokemon);
    expect(result.is_shiny).toBe(false);
    expect(result.ribbons).toEqual([]);
    expect(result.tags).toEqual([]);
  });

  it("level boundaries: 1 and 100 pass, 0 and 101 fail", () => {
    expect(pokemonSchema.safeParse({ ...validPokemon, level: 1 }).success).toBe(true);
    expect(pokemonSchema.safeParse({ ...validPokemon, level: 100 }).success).toBe(true);
    expect(pokemonSchema.safeParse({ ...validPokemon, level: 0 }).success).toBe(false);
    expect(pokemonSchema.safeParse({ ...validPokemon, level: 101 }).success).toBe(false);
  });

  it("tag format validation", () => {
    expect(pokemonSchema.safeParse({ ...validPokemon, tags: ["valid-tag"] }).success).toBe(true);
    expect(pokemonSchema.safeParse({ ...validPokemon, tags: ["valid"] }).success).toBe(true);
    expect(pokemonSchema.safeParse({ ...validPokemon, tags: ["Invalid"] }).success).toBe(false);
    expect(pokemonSchema.safeParse({ ...validPokemon, tags: ["-start"] }).success).toBe(false);
    expect(pokemonSchema.safeParse({ ...validPokemon, tags: ["end-"] }).success).toBe(false);
  });

  it("gender enum validation", () => {
    expect(pokemonSchema.safeParse({ ...validPokemon, gender: "Male" }).success).toBe(true);
    expect(pokemonSchema.safeParse({ ...validPokemon, gender: "Female" }).success).toBe(true);
    expect(pokemonSchema.safeParse({ ...validPokemon, gender: "Genderless" }).success).toBe(true);
    expect(pokemonSchema.safeParse({ ...validPokemon, gender: "Other" }).success).toBe(false);
  });
});

describe("createPokemonSchema", () => {
  it("omits id, created_at, updated_at", () => {
    const result = createPokemonSchema.safeParse({
      species: "Pikachu",
      dex_number: 25,
    });
    expect(result.success).toBe(true);
    // id should not be in the shape
    const shape = createPokemonSchema.shape;
    expect("id" in shape).toBe(false);
    expect("created_at" in shape).toBe(false);
    expect("updated_at" in shape).toBe(false);
  });
});

describe("updatePokemonSchema", () => {
  it("all fields optional (partial)", () => {
    const result = updatePokemonSchema.safeParse({});
    expect(result.success).toBe(true);

    const partial = updatePokemonSchema.safeParse({ nickname: "Sparky" });
    expect(partial.success).toBe(true);
  });
});

describe("pokemonFiltersSchema", () => {
  it("defaults for sort_by and sort_order", () => {
    const result = pokemonFiltersSchema.parse({});
    expect(result.sort_by).toBe("dex_number");
    expect(result.sort_order).toBe("asc");
  });

  it("accepts valid filter combinations", () => {
    const result = pokemonFiltersSchema.safeParse({
      search: "pikachu",
      is_shiny: true,
      sort_by: "species",
      sort_order: "desc",
    });
    expect(result.success).toBe(true);
  });
});
