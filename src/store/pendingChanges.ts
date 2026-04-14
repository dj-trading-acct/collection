import type { Pokemon } from "../data/types";

export interface PendingChange {
  type: "add" | "update" | "delete";
  pokemon: Pokemon;
  previous?: Pokemon;
}

export interface MetaChange {
  field: string;
  label: string;
  from: string;
  to: string;
}

let changes: PendingChange[] = [];
let metaChanges: MetaChange[] = [];
let listeners: Array<() => void> = [];

function notify() {
  for (const fn of listeners) fn();
}

export function subscribe(listener: () => void): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export function getChanges(): PendingChange[] {
  return changes;
}

export function getMetaChanges(): MetaChange[] {
  return metaChanges;
}

export function addMetaChange(change: MetaChange): void {
  const existing = metaChanges.find((c) => c.field === change.field);
  if (existing) {
    existing.to = change.to;
    // If reverted to original value, remove the change
    if (existing.from === existing.to) {
      metaChanges = metaChanges.filter((c) => c.field !== change.field);
    }
  } else {
    metaChanges.push(change);
  }
  notify();
}

export function addChange(change: PendingChange): void {
  // If updating a pokemon that was just added, merge into a single "add"
  if (change.type === "update") {
    const existingAdd = changes.find(
      (c) => c.type === "add" && c.pokemon.id === change.pokemon.id,
    );
    if (existingAdd) {
      existingAdd.pokemon = change.pokemon;
      notify();
      return;
    }

    // Collapse consecutive updates to the same pokemon
    const existingUpdate = changes.find(
      (c) => c.type === "update" && c.pokemon.id === change.pokemon.id,
    );
    if (existingUpdate) {
      existingUpdate.pokemon = change.pokemon;
      notify();
      return;
    }
  }

  // If deleting a pokemon that was just added, remove both
  if (change.type === "delete") {
    const addIdx = changes.findIndex(
      (c) => c.type === "add" && c.pokemon.id === change.pokemon.id,
    );
    if (addIdx !== -1) {
      changes.splice(addIdx, 1);
      notify();
      return;
    }

    // If deleting a pokemon that was updated, replace with delete
    const updateIdx = changes.findIndex(
      (c) => c.type === "update" && c.pokemon.id === change.pokemon.id,
    );
    if (updateIdx !== -1) {
      changes[updateIdx] = { ...change, previous: changes[updateIdx].previous };
      notify();
      return;
    }
  }

  changes.push(change);
  notify();
}

export function clearChanges(): void {
  changes = [];
  metaChanges = [];
  notify();
}

export function hasChanges(): boolean {
  return changes.length > 0 || metaChanges.length > 0;
}

/** @internal */
export function _resetForTesting(): void {
  changes = [];
  metaChanges = [];
  listeners = [];
}

export function getChangeSummary(): string {
  const added = changes.filter((c) => c.type === "add");
  const updated = changes.filter((c) => c.type === "update");
  const deleted = changes.filter((c) => c.type === "delete");

  const parts: string[] = [];
  if (metaChanges.length) {
    parts.push(`changed ${metaChanges.map((c) => c.label).join(", ")}`);
  }
  if (added.length) {
    parts.push(`added ${added.map((c) => c.pokemon.nickname ?? c.pokemon.species).join(", ")}`);
  }
  if (updated.length) {
    parts.push(`updated ${updated.map((c) => c.pokemon.nickname ?? c.pokemon.species).join(", ")}`);
  }
  if (deleted.length) {
    parts.push(`removed ${deleted.map((c) => c.pokemon.nickname ?? c.pokemon.species).join(", ")}`);
  }
  return parts.length ? `Update collection: ${parts.join("; ")}` : "";
}
