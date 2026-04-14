import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useCreatePokemon, useUpdatePokemon, useDeletePokemon } from "../mutations";
import { createWrapper, createTestPokemon } from "../../test/utils";

vi.mock("../../store/collection", () => ({
  loadCollection: vi.fn().mockResolvedValue(undefined),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  getById: vi.fn(),
}));

vi.mock("../../store/pendingChanges", () => ({
  addChange: vi.fn(),
}));

import { create, update, remove, getById } from "../../store/collection";
import { addChange } from "../../store/pendingChanges";

const mockCreate = vi.mocked(create);
const mockUpdate = vi.mocked(update);
const mockRemove = vi.mocked(remove);
const mockGetById = vi.mocked(getById);
const mockAddChange = vi.mocked(addChange);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useCreatePokemon", () => {
  it("calls create() and addChange({ type: 'add' })", async () => {
    const pokemon = createTestPokemon({ id: "new1" });
    mockCreate.mockReturnValue(pokemon);

    const { result } = renderHook(() => useCreatePokemon(), { wrapper: createWrapper() });

    result.current.mutate({
      species: "Pikachu",
      dex_number: 25,
      is_shiny: false,
      is_event: false,
      is_alpha: false,
      is_hidden_ability: false,
      is_available_for_trade: false,
      ribbons: [],
      marks: [],
      tags: [],
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockCreate).toHaveBeenCalled();
    expect(mockAddChange).toHaveBeenCalledWith({ type: "add", pokemon });
  });
});

describe("useUpdatePokemon", () => {
  it("calls update() and addChange({ type: 'update' }) with previous", async () => {
    const previous = createTestPokemon({ id: "p1" });
    const updated = createTestPokemon({ id: "p1", nickname: "Updated" });
    mockGetById.mockReturnValue(previous);
    mockUpdate.mockReturnValue(updated);

    const { result } = renderHook(() => useUpdatePokemon(), { wrapper: createWrapper() });

    result.current.mutate({ id: "p1", data: { nickname: "Updated" } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockUpdate).toHaveBeenCalledWith("p1", { nickname: "Updated" });
    expect(mockAddChange).toHaveBeenCalledWith({ type: "update", pokemon: updated, previous });
  });
});

describe("useDeletePokemon", () => {
  it("calls remove() and addChange({ type: 'delete' })", async () => {
    const pokemon = createTestPokemon({ id: "p1" });
    mockGetById.mockReturnValue(pokemon);

    const { result } = renderHook(() => useDeletePokemon(), { wrapper: createWrapper() });

    result.current.mutate("p1");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockRemove).toHaveBeenCalledWith("p1");
    expect(mockAddChange).toHaveBeenCalledWith({ type: "delete", pokemon });
  });
});
