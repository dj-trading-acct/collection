import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  addChange,
  addMetaChange,
  clearChanges,
  getChanges,
  getMetaChanges,
  hasChanges,
  getChangeSummary,
  subscribe,
  _resetForTesting,
} from "../pendingChanges";
import { createTestPokemon } from "../../test/utils";

beforeEach(() => {
  _resetForTesting();
});

describe("addChange", () => {
  it("records an add change", () => {
    const pokemon = createTestPokemon({ id: "p1" });
    addChange({ type: "add", pokemon });
    expect(getChanges()).toHaveLength(1);
    expect(getChanges()[0].type).toBe("add");
  });

  it("records an update change", () => {
    const pokemon = createTestPokemon({ id: "p1", nickname: "Updated" });
    const previous = createTestPokemon({ id: "p1" });
    addChange({ type: "update", pokemon, previous });
    expect(getChanges()).toHaveLength(1);
    expect(getChanges()[0].type).toBe("update");
  });

  it("records a delete change", () => {
    const pokemon = createTestPokemon({ id: "p1" });
    addChange({ type: "delete", pokemon });
    expect(getChanges()).toHaveLength(1);
    expect(getChanges()[0].type).toBe("delete");
  });

  it("update after add: merges into single add with updated pokemon", () => {
    const pokemon = createTestPokemon({ id: "p1" });
    addChange({ type: "add", pokemon });

    const updated = createTestPokemon({ id: "p1", nickname: "Updated" });
    addChange({ type: "update", pokemon: updated });

    expect(getChanges()).toHaveLength(1);
    expect(getChanges()[0].type).toBe("add");
    expect(getChanges()[0].pokemon.nickname).toBe("Updated");
  });

  it("consecutive updates collapse: keeps first previous, updates pokemon", () => {
    const original = createTestPokemon({ id: "p1" });
    const first = createTestPokemon({ id: "p1", nickname: "First" });
    addChange({ type: "update", pokemon: first, previous: original });

    const second = createTestPokemon({ id: "p1", nickname: "Second" });
    addChange({ type: "update", pokemon: second, previous: first });

    expect(getChanges()).toHaveLength(1);
    expect(getChanges()[0].pokemon.nickname).toBe("Second");
    // First previous is preserved
    expect(getChanges()[0].previous?.nickname).toBeNull();
  });

  it("delete after add: cancels both", () => {
    const pokemon = createTestPokemon({ id: "p1" });
    addChange({ type: "add", pokemon });
    addChange({ type: "delete", pokemon });

    expect(getChanges()).toHaveLength(0);
  });

  it("delete after update: replaces update with delete, preserves previous", () => {
    const original = createTestPokemon({ id: "p1" });
    const updated = createTestPokemon({ id: "p1", nickname: "Updated" });
    addChange({ type: "update", pokemon: updated, previous: original });

    addChange({ type: "delete", pokemon: updated });

    expect(getChanges()).toHaveLength(1);
    expect(getChanges()[0].type).toBe("delete");
    expect(getChanges()[0].previous?.id).toBe("p1");
  });
});

describe("clearChanges", () => {
  it("empties all changes and meta changes", () => {
    addChange({ type: "add", pokemon: createTestPokemon() });
    addMetaChange({ field: "name", label: "Name", from: "A", to: "B" });
    clearChanges();
    expect(getChanges()).toHaveLength(0);
    expect(getMetaChanges()).toHaveLength(0);
  });
});

describe("subscribe", () => {
  it("listener called on each change", () => {
    const listener = vi.fn();
    subscribe(listener);
    addChange({ type: "add", pokemon: createTestPokemon() });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("returned unsubscribe function removes listener", () => {
    const listener = vi.fn();
    const unsub = subscribe(listener);
    unsub();
    addChange({ type: "add", pokemon: createTestPokemon() });
    expect(listener).not.toHaveBeenCalled();
  });
});

describe("addMetaChange", () => {
  it("records a new meta change", () => {
    addMetaChange({ field: "name", label: "Display Name", from: "A", to: "B" });
    expect(getMetaChanges()).toHaveLength(1);
    expect(getMetaChanges()[0].to).toBe("B");
  });

  it("updates existing meta change (same field)", () => {
    addMetaChange({ field: "name", label: "Display Name", from: "A", to: "B" });
    addMetaChange({ field: "name", label: "Display Name", from: "A", to: "C" });
    expect(getMetaChanges()).toHaveLength(1);
    expect(getMetaChanges()[0].to).toBe("C");
  });

  it("removes meta change when reverted to original value", () => {
    addMetaChange({ field: "name", label: "Display Name", from: "A", to: "B" });
    addMetaChange({ field: "name", label: "Display Name", from: "A", to: "A" });
    expect(getMetaChanges()).toHaveLength(0);
  });
});

describe("hasChanges", () => {
  it("returns false when empty", () => {
    expect(hasChanges()).toBe(false);
  });

  it("returns true with pokemon changes", () => {
    addChange({ type: "add", pokemon: createTestPokemon() });
    expect(hasChanges()).toBe(true);
  });

  it("returns true with meta changes", () => {
    addMetaChange({ field: "name", label: "Name", from: "A", to: "B" });
    expect(hasChanges()).toBe(true);
  });
});

describe("getChangeSummary", () => {
  it("formats added/updated/removed/meta descriptions", () => {
    addChange({ type: "add", pokemon: createTestPokemon({ species: "Pikachu" }) });
    addChange({
      type: "update",
      pokemon: createTestPokemon({ id: "u1", species: "Charizard" }),
      previous: createTestPokemon({ id: "u1" }),
    });
    addChange({ type: "delete", pokemon: createTestPokemon({ id: "d1", species: "Bulbasaur" }) });
    addMetaChange({ field: "name", label: "Display Name", from: "A", to: "B" });

    const summary = getChangeSummary();
    expect(summary).toContain("added Pikachu");
    expect(summary).toContain("updated Charizard");
    expect(summary).toContain("removed Bulbasaur");
    expect(summary).toContain("changed Display Name");
  });

  it("returns empty string when no changes", () => {
    expect(getChangeSummary()).toBe("");
  });
});
