import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { usePokemonList, usePokemon, usePokemonFilters, useCollectionOwner } from "../queries";
import { createWrapper, createTestPokemon } from "../../test/utils";

const pikachu = createTestPokemon({ id: "p1", species: "Pikachu", dex_number: 25 });
const charizard = createTestPokemon({ id: "p2", species: "Charizard", dex_number: 6 });

vi.mock("../../store/collection", () => ({
  loadCollection: vi.fn().mockResolvedValue(undefined),
  getAllRaw: vi.fn(),
  getFilterOptions: vi.fn(),
  getOwnerName: vi.fn(),
  matchesFilters: vi.fn(),
  sortPokemon: vi.fn(),
}));

import { getAllRaw, getFilterOptions, getOwnerName, matchesFilters, sortPokemon } from "../../store/collection";

const mockGetAllRaw = vi.mocked(getAllRaw);
const mockGetFilterOptions = vi.mocked(getFilterOptions);
const mockGetOwnerName = vi.mocked(getOwnerName);
const mockMatchesFilters = vi.mocked(matchesFilters);
const mockSortPokemon = vi.mocked(sortPokemon);

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAllRaw.mockReturnValue([pikachu, charizard]);
  mockMatchesFilters.mockReturnValue(true);
  mockSortPokemon.mockImplementation((list) => list);
});

describe("usePokemonList", () => {
  it("returns filtered and sorted results", async () => {
    mockSortPokemon.mockReturnValue([charizard, pikachu]);

    const { result } = renderHook(() => usePokemonList({}), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
  });

  it("applies filter callback correctly", async () => {
    mockMatchesFilters.mockImplementation((p) => p.species === "Pikachu");
    mockSortPokemon.mockImplementation((list) => list);

    const { result } = renderHook(
      () => usePokemonList({ search: "pika" }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0].species).toBe("Pikachu");
  });
});

describe("usePokemon", () => {
  it("returns single pokemon by ID", async () => {
    const { result } = renderHook(() => usePokemon("p1"), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.species).toBe("Pikachu");
  });

  it("returns undefined for missing ID", async () => {
    const { result } = renderHook(() => usePokemon("nonexistent"), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeUndefined();
  });
});

describe("usePokemonFilters", () => {
  it("returns filter options", async () => {
    const options = { species: ["Pikachu", "Charizard"], nature: ["Hardy"] };
    mockGetFilterOptions.mockReturnValue(options as any);

    const { result } = renderHook(() => usePokemonFilters(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(options);
  });
});

describe("useCollectionOwner", () => {
  it("returns display name", async () => {
    mockGetOwnerName.mockReturnValue("Ash");

    const { result } = renderHook(() => useCollectionOwner(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe("Ash");
  });
});
