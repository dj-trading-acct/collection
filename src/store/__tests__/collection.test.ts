import { describe, it, expect, beforeEach } from "vitest";
import {
  matchesFilters,
  sortPokemon,
  create,
  update,
  remove,
  getById,
  getAllRaw,
  getFilterOptions,
  getOwnerName,
  setOwnerName,
  toJSON,
  _resetForTesting,
  _loadForTesting,
} from "../collection";
import { createTestPokemon } from "../../test/utils";
import type { Pokemon } from "../../data/types";

beforeEach(() => {
  _resetForTesting();
});

// ---- matchesFilters ----

describe("matchesFilters", () => {
  const pokemon = createTestPokemon({
    species: "Pikachu",
    nickname: "Sparky",
    ot_name: "Ash",
    tags: ["starter", "electric"],
    poke_ball: "Poke Ball",
    origin_mark: "Paldea",
    current_location: "Box 1",
    nature: "Hardy",
    gender: "Male",
    language_tag: "ENG",
    is_shiny: true,
    is_event: false,
    is_alpha: false,
    is_available_for_trade: true,
    is_hidden_ability: false,
  });

  it("returns true when no filters are applied", () => {
    expect(matchesFilters(pokemon, {})).toBe(true);
  });

  it("text search matches species (case-insensitive)", () => {
    expect(matchesFilters(pokemon, { search: "pika" })).toBe(true);
  });

  it("text search matches nickname", () => {
    expect(matchesFilters(pokemon, { search: "sparky" })).toBe(true);
  });

  it("text search matches ot_name", () => {
    expect(matchesFilters(pokemon, { search: "ash" })).toBe(true);
  });

  it("text search matches tags", () => {
    expect(matchesFilters(pokemon, { search: "electric" })).toBe(true);
  });

  it("text search returns false when no fields match", () => {
    expect(matchesFilters(pokemon, { search: "charizard" })).toBe(false);
  });

  it("multi-select filter: single value match for ball", () => {
    expect(matchesFilters(pokemon, { ball: "Poke Ball" })).toBe(true);
    expect(matchesFilters(pokemon, { ball: "Ultra Ball" })).toBe(false);
  });

  it("multi-select filter: comma-separated values", () => {
    expect(matchesFilters(pokemon, { ball: "Poke Ball,Ultra Ball" })).toBe(true);
    expect(matchesFilters(pokemon, { ball: "Ultra Ball,Great Ball" })).toBe(false);
  });

  it("multi-select filter: origin_mark", () => {
    expect(matchesFilters(pokemon, { origin_mark: "Paldea" })).toBe(true);
    expect(matchesFilters(pokemon, { origin_mark: "Galar" })).toBe(false);
  });

  it("multi-select filter: species", () => {
    expect(matchesFilters(pokemon, { species: "Pikachu" })).toBe(true);
  });

  it("multi-select filter: nature", () => {
    expect(matchesFilters(pokemon, { nature: "Hardy" })).toBe(true);
  });

  it("multi-select filter: gender", () => {
    expect(matchesFilters(pokemon, { gender: "Male" })).toBe(true);
    expect(matchesFilters(pokemon, { gender: "Female" })).toBe(false);
  });

  it("multi-select filter: language_tag", () => {
    expect(matchesFilters(pokemon, { language_tag: "ENG" })).toBe(true);
  });

  it("boolean filter: is_shiny", () => {
    expect(matchesFilters(pokemon, { is_shiny: true })).toBe(true);
    expect(matchesFilters(createTestPokemon({ is_shiny: false }), { is_shiny: true })).toBe(false);
  });

  it("boolean filter: is_available_for_trade", () => {
    expect(matchesFilters(pokemon, { is_available_for_trade: true })).toBe(true);
  });

  it("boolean filter: is_event false does not filter", () => {
    // When filter is not set or false, it should not filter
    expect(matchesFilters(pokemon, { is_event: false })).toBe(true);
  });

  it("tag filter: single tag", () => {
    expect(matchesFilters(pokemon, { tag: "starter" })).toBe(true);
    expect(matchesFilters(pokemon, { tag: "legendary" })).toBe(false);
  });

  it("tag filter: multiple tags (all must match)", () => {
    expect(matchesFilters(pokemon, { tag: "starter,electric" })).toBe(true);
    expect(matchesFilters(pokemon, { tag: "starter,legendary" })).toBe(false);
  });

  it("combined filters", () => {
    expect(
      matchesFilters(pokemon, {
        search: "pika",
        is_shiny: true,
        ball: "Poke Ball",
      }),
    ).toBe(true);
    expect(
      matchesFilters(pokemon, {
        search: "pika",
        is_shiny: true,
        ball: "Ultra Ball",
      }),
    ).toBe(false);
  });
});

// ---- sortPokemon ----

describe("sortPokemon", () => {
  const list: Pokemon[] = [
    createTestPokemon({ id: "a", species: "Bulbasaur", dex_number: 1, is_shiny: false }),
    createTestPokemon({ id: "b", species: "Pikachu", dex_number: 25, is_shiny: true }),
    createTestPokemon({ id: "c", species: "Charizard", dex_number: 6, is_shiny: false }),
  ];

  it("sorts by dex_number ascending (default)", () => {
    const sorted = sortPokemon(list);
    expect(sorted.map((p) => p.dex_number)).toEqual([1, 6, 25]);
  });

  it("sorts by dex_number descending", () => {
    const sorted = sortPokemon(list, "dex_number", "desc");
    expect(sorted.map((p) => p.dex_number)).toEqual([25, 6, 1]);
  });

  it("sorts by string column (species) using localeCompare", () => {
    const sorted = sortPokemon(list, "species", "asc");
    expect(sorted.map((p) => p.species)).toEqual(["Bulbasaur", "Charizard", "Pikachu"]);
  });

  it("sorts by boolean column (is_shiny)", () => {
    const sorted = sortPokemon(list, "is_shiny", "desc");
    expect(sorted[0].is_shiny).toBe(true);
  });

  it("sorts with null values (nulls sort to end)", () => {
    const withNulls = [
      createTestPokemon({ id: "x", nickname: null, dex_number: 1 }),
      createTestPokemon({ id: "y", nickname: "Sparky", dex_number: 2 }),
    ];
    const sorted = sortPokemon(withNulls, "nickname", "asc");
    expect(sorted[0].nickname).toBe("Sparky");
    expect(sorted[1].nickname).toBeNull();
  });

  it("invalid sort column falls back to dex_number", () => {
    const sorted = sortPokemon(list, "nonexistent");
    expect(sorted.map((p) => p.dex_number)).toEqual([1, 6, 25]);
  });

  it("empty list returns empty", () => {
    expect(sortPokemon([])).toEqual([]);
  });
});

// ---- CRUD ----

describe("CRUD operations", () => {
  beforeEach(() => {
    _loadForTesting({
      meta: { version: 1, display_name: "Ash" },
      pokemon: [createTestPokemon({ id: "pika1", species: "Pikachu" })],
    });
  });

  it("create() generates unique ID and sets timestamps", () => {
    const pokemon = create({
      species: "Bulbasaur",
      dex_number: 1,
      is_shiny: false,
      is_event: false,
      is_alpha: false,
      is_hidden_ability: false,
      is_available_for_trade: false,
      ribbons: [],
      marks: [],
      tags: [],
    });
    expect(pokemon.id).toBeTruthy();
    expect(pokemon.id).not.toBe("pika1");
    expect(pokemon.species).toBe("Bulbasaur");
    expect(pokemon.created_at).toBeTruthy();
    expect(pokemon.updated_at).toBeTruthy();
    expect(getAllRaw()).toHaveLength(2);
  });

  it("update() updates specified fields and preserves ID", () => {
    const updated = update("pika1", { nickname: "Sparky" });
    expect(updated.id).toBe("pika1");
    expect(updated.nickname).toBe("Sparky");
    expect(updated.species).toBe("Pikachu");
  });

  it("update() updates updated_at timestamp", () => {
    const before = getById("pika1")!.updated_at;
    const updated = update("pika1", { nickname: "Sparky" });
    expect(updated.updated_at).not.toBe(before);
  });

  it("update() throws for invalid data", () => {
    expect(() => update("pika1", { level: 200 } as any)).toThrow();
  });

  it("update() throws for non-existent ID", () => {
    expect(() => update("nonexistent", { nickname: "X" })).toThrow("not found");
  });

  it("remove() removes from collection", () => {
    remove("pika1");
    expect(getAllRaw()).toHaveLength(0);
  });

  it("remove() throws for non-existent ID", () => {
    expect(() => remove("nonexistent")).toThrow("not found");
  });

  it("getById() returns copy of pokemon", () => {
    const p = getById("pika1");
    expect(p).toBeDefined();
    expect(p!.id).toBe("pika1");
    // Should be a copy
    p!.nickname = "mutated";
    expect(getById("pika1")!.nickname).not.toBe("mutated");
  });

  it("getById() returns undefined for missing ID", () => {
    expect(getById("nonexistent")).toBeUndefined();
  });

  it("getAllRaw() returns copy of array", () => {
    const all = getAllRaw();
    all.push(createTestPokemon({ id: "extra" }));
    expect(getAllRaw()).toHaveLength(1);
  });

  it("getFilterOptions() extracts unique values per field", () => {
    create({
      species: "Charizard",
      dex_number: 6,
      poke_ball: "Ultra Ball",
      is_shiny: false,
      is_event: false,
      is_alpha: false,
      is_hidden_ability: false,
      is_available_for_trade: false,
      ribbons: [],
      marks: [],
      tags: ["fire"],
    });
    const options = getFilterOptions();
    expect(options.species).toContain("Pikachu");
    expect(options.species).toContain("Charizard");
    expect(options.tags).toContain("fire");
  });

  it("getOwnerName() / setOwnerName()", () => {
    expect(getOwnerName()).toBe("Ash");
    setOwnerName("Gary");
    expect(getOwnerName()).toBe("Gary");
  });

  it("toJSON() serializes correctly", () => {
    const json = toJSON();
    const parsed = JSON.parse(json);
    expect(parsed.meta.display_name).toBe("Ash");
    expect(parsed.pokemon).toHaveLength(1);
  });
});

// ---- ensureLoaded guard ----

describe("ensureLoaded guard", () => {
  it("throws when collection not loaded", () => {
    // _resetForTesting sets loaded = false
    expect(() => getAllRaw()).toThrow("Collection not loaded");
    expect(() => getById("x")).toThrow("Collection not loaded");
    expect(() => create({ species: "X", dex_number: 1, is_shiny: false, is_event: false, is_alpha: false, is_hidden_ability: false, is_available_for_trade: false, ribbons: [], marks: [], tags: [] })).toThrow("Collection not loaded");
    expect(() => update("x", {})).toThrow("Collection not loaded");
    expect(() => remove("x")).toThrow("Collection not loaded");
    expect(() => getFilterOptions()).toThrow("Collection not loaded");
    expect(() => getOwnerName()).toThrow("Collection not loaded");
    expect(() => setOwnerName("x")).toThrow("Collection not loaded");
    expect(() => toJSON()).toThrow("Collection not loaded");
  });
});
