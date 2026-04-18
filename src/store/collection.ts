import { z } from "zod";
import { pokemonSchema, updatePokemonSchema } from "../data/schemas";
import type {
  Pokemon,
  CreatePokemon,
  UpdatePokemon,
  PokemonFilters,
} from "../data/types";

const collectionDataSchema = z.object({
  meta: z.object({
    version: z.number(),
    display_name: z.string(),
  }),
  pokemon: z.array(pokemonSchema),
});

type CollectionData = z.infer<typeof collectionDataSchema>;

const ALLOWED_SORT_COLUMNS = [
  "id",
  "species",
  "dex_number",
  "nickname",
  "level",
  "nature",
  "origin_mark",
  "current_location",
  "poke_ball",
  "created_at",
  "updated_at",
  "is_shiny",
  "is_event",
  "ot_name",
];

const ALPHANUMERIC = 'abcdefghijklmnopqrstuvwxyz0123456789';
const ID_LENGTH = 4;

function generateId(): string {
  let id = '';
  for (let i = 0; i < ID_LENGTH; i++) {
    id += ALPHANUMERIC[Math.floor(Math.random() * ALPHANUMERIC.length)];
  }
  return id;
}

function generateUniqueId(): string {
  const existingIds = new Set(data.pokemon.map((p) => p.id));
  let id = generateId();
  while (existingIds.has(id)) {
    id = generateId();
  }
  return id;
}

let data: CollectionData = {
  meta: { version: 1, display_name: "" },
  pokemon: [],
};

// Tracks the SHA of collection.json at the time we loaded/authenticated,
// so we can detect if someone else pushed a newer version before we save.
let baselineSha: string | null = null;

export function getBaselineSha(): string | null {
  return baselineSha;
}

export function setBaselineSha(sha: string | null): void {
  baselineSha = sha;
}

let loaded = false;
let loadPromise: Promise<void> | null = null;

export async function loadCollection(): Promise<void> {
  if (loaded) return;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      const res = await fetch(import.meta.env.BASE_URL + "data/collection.json");
      if (res.ok) {
        const json = await res.json();
        const parsed = collectionDataSchema.safeParse(json);
        if (!parsed.success) {
          throw new Error(
            `Invalid collection data: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`,
          );
        }
        data = parsed.data;
      } else if (res.status !== 404) {
        throw new Error(`Failed to load collection: ${res.status} ${res.statusText}`);
      }
      loaded = true;
    } catch (e) {
      // Reset so a subsequent call can retry
      loadPromise = null;
      throw new Error("Failed to load collection data", { cause: e });
    }
  })();

  return loadPromise;
}

function ensureLoaded() {
  if (!loaded) throw new Error("Collection not loaded. Call loadCollection() first.");
}

// ---- Filtering & Sorting (ported from server/src/routes/pokemon.ts) ----

export function matchesFilters(p: Pokemon, filters: Partial<PokemonFilters>): boolean {
  // Text search across species, nickname, ot_name, tags
  if (filters.search) {
    const q = filters.search.toLowerCase();
    const fields = [
      p.species,
      p.nickname,
      p.ot_name,
      ...(p.tags ?? []),
    ];
    if (!fields.some((f) => f && f.toLowerCase().includes(q))) {
      return false;
    }
  }

  // Multi-select filters (comma-separated)
  const multiFilters: [keyof PokemonFilters, keyof Pokemon][] = [
    ["species", "species"],
    ["nature", "nature"],
    ["gender", "gender"],
    ["ball", "poke_ball"],
    ["origin_mark", "origin_mark"],
    ["current_location", "current_location"],
    ["language_tag", "language_tag"],
  ];

  for (const [filterKey, field] of multiFilters) {
    const val = filters[filterKey];
    if (typeof val === "string" && val) {
      const values = val.split(",").map((v) => v.trim());
      if (!values.includes(String(p[field] ?? ""))) {
        return false;
      }
    }
  }

  // Boolean filters
  const boolFilters: (keyof PokemonFilters & keyof Pokemon)[] = [
    "is_shiny",
    "is_event",
    "is_alpha",
    "is_available_for_trade",
    "is_hidden_ability",
  ];
  for (const key of boolFilters) {
    if (filters[key] === true) {
      if (!p[key]) return false;
    }
  }

  // Tag filter
  if (filters.tag) {
    const tagValues = filters.tag.split(",").map((v) => v.trim());
    const pokemonTags = p.tags ?? [];
    if (!tagValues.every((t) => pokemonTags.includes(t))) {
      return false;
    }
  }

  return true;
}

export function sortPokemon(
  list: Pokemon[],
  sortBy: string = "dex_number",
  sortOrder: string = "asc"
): Pokemon[] {
  const col = ALLOWED_SORT_COLUMNS.includes(sortBy) ? sortBy : "dex_number";
  const dir = sortOrder === "desc" ? -1 : 1;

  return [...list].sort((a, b) => {
    const aVal = (a as Record<string, unknown>)[col];
    const bVal = (b as Record<string, unknown>)[col];

    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;

    if (typeof aVal === "string" && typeof bVal === "string") {
      return aVal.localeCompare(bVal) * dir;
    }
    if (typeof aVal === "boolean" && typeof bVal === "boolean") {
      return ((aVal ? 1 : 0) - (bVal ? 1 : 0)) * dir;
    }
    return ((aVal as number) - (bVal as number)) * dir;
  });
}

// ---- CRUD ----

export function getAllRaw(): Pokemon[] {
  ensureLoaded();
  return [...data.pokemon];
}

export function getById(id: string): Pokemon | undefined {
  ensureLoaded();
  const p = data.pokemon.find((p) => p.id === id);
  return p ? { ...p } : undefined;
}

export function create(input: CreatePokemon): Pokemon {
  ensureLoaded();
  const now = new Date().toISOString();
  const pokemon: Pokemon = {
    ...input,
    id: generateUniqueId(),
    created_at: now,
    updated_at: now,
  };
  data.pokemon.push(pokemon);
  return pokemon;
}

export function update(id: string, input: UpdatePokemon): Pokemon {
  ensureLoaded();
  const parsed = updatePokemonSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(`Invalid update data: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
  }
  const idx = data.pokemon.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error(`Pokemon ${id} not found`);

  // Only apply fields that are explicitly defined to avoid blanking required fields
  const defined = Object.fromEntries(
    Object.entries(input).filter(([, v]) => v !== undefined),
  );
  const updated: Pokemon = {
    ...data.pokemon[idx],
    ...defined,
    id, // preserve id
    updated_at: new Date().toISOString(),
  };
  data.pokemon[idx] = updated;
  return updated;
}

export function remove(id: string): void {
  ensureLoaded();
  const idx = data.pokemon.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error(`Pokemon ${id} not found`);
  data.pokemon.splice(idx, 1);
}

export function bulkUpdate(ids: string[], input: UpdatePokemon): Pokemon[] {
  ensureLoaded();
  return ids.map((id) => update(id, input));
}

export function bulkRemove(ids: string[]): Pokemon[] {
  ensureLoaded();
  const removed: Pokemon[] = [];
  for (const id of ids) {
    const p = getById(id);
    if (p) {
      remove(id);
      removed.push(p);
    }
  }
  return removed;
}

export function removeByTag(tag: string): Pokemon[] {
  ensureLoaded();
  const removed: Pokemon[] = [];
  data.pokemon = data.pokemon.filter((p) => {
    if (p.tags?.includes(tag)) {
      removed.push(p);
      return false;
    }
    return true;
  });
  return removed;
}

// ---- Trainer profiles (derived from existing pokemon) ----

export interface TrainerProfile {
  ot_name: string;
  ot_tid: string;
  language_tag: string;
  origin_mark: string;
}

export function getTrainerProfiles(): TrainerProfile[] {
  ensureLoaded();
  const seen = new Set<string>();
  const profiles: TrainerProfile[] = [];
  for (const p of data.pokemon) {
    if (!p.ot_name && !p.ot_tid) continue;
    const key = [p.ot_name ?? '', p.ot_tid ?? '', p.language_tag ?? '', p.origin_mark ?? ''].join('\0');
    if (seen.has(key)) continue;
    seen.add(key);
    profiles.push({
      ot_name: p.ot_name ?? '',
      ot_tid: p.ot_tid ?? '',
      language_tag: p.language_tag ?? '',
      origin_mark: p.origin_mark ?? '',
    });
  }
  return profiles.sort((a, b) => a.ot_name.localeCompare(b.ot_name) || a.origin_mark.localeCompare(b.origin_mark));
}

// ---- Filter options (replaces /api/pokemon/filters) ----

export function getFilterOptions(): Record<string, string[]> {
  ensureLoaded();
  const unique = (field: keyof Pokemon) => {
    const set = new Set<string>();
    for (const p of data.pokemon) {
      const v = p[field];
      if (v != null && v !== "") set.add(String(v));
    }
    return [...set].sort();
  };

  const tagSet = new Set<string>();
  for (const p of data.pokemon) {
    for (const t of p.tags ?? []) tagSet.add(t);
  }

  return {
    species: unique("species"),
    nature: unique("nature"),
    ball: unique("poke_ball"),
    origin_mark: unique("origin_mark"),
    current_location: unique("current_location"),
    language_tag: unique("language_tag"),
    ot_name: unique("ot_name"),
    ot_tid: unique("ot_tid"),
    tags: [...tagSet].sort(),
  };
}

// ---- Meta ----

export function getOwnerName(): string {
  ensureLoaded();
  return data.meta.display_name;
}

export function setOwnerName(name: string): void {
  ensureLoaded();
  data.meta.display_name = name;
}

// ---- Serialization ----

export function toJSON(): string {
  ensureLoaded();
  return JSON.stringify(data, null, 2);
}

/** @internal — only for tests */
export function _resetForTesting(): void {
  data = { meta: { version: 1, display_name: "" }, pokemon: [] };
  loaded = false;
  loadPromise = null;
}

/** @internal — directly set data for tests */
export function _loadForTesting(input: {
  meta: { version: number; display_name: string };
  pokemon: Pokemon[];
}): void {
  data = input;
  loaded = true;
  loadPromise = null;
}
