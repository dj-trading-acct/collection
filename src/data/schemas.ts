import { z } from "zod";

const genderEnum = z.enum(["Male", "Female", "Genderless"]);

const languageTagEnum = z.enum([
  "JPN",
  "ENG",
  "FRE",
  "GER",
  "ITA",
  "SPA",
  "KOR",
  "CHS",
  "CHT",
]);

export const pokemonSchema = z.object({
  id: z.string(),
  species: z.string(),
  dex_number: z.number().int(),
  form: z.string().nullable().optional(),

  nickname: z.string().nullable().optional(),
  gender: genderEnum.nullable().optional(),
  level: z.number().int().min(1).max(100).nullable().optional(),
  nature: z.string().nullable().optional(),

  ability: z.string().nullable().optional(),
  is_hidden_ability: z.boolean().default(false),
  ot_name: z.string().nullable().optional(),
  ot_tid: z.string().nullable().optional(),

  language_tag: languageTagEnum.nullable().optional(),
  origin_mark: z.string().nullable().optional(),
  current_location: z.string().nullable().optional(),
  is_shiny: z.boolean().default(false),
  is_event: z.boolean().default(false),
  is_alpha: z.boolean().default(false),

  is_available_for_trade: z.boolean().default(false),
  poke_ball: z.string().nullable().optional(),
  ribbons: z.array(z.string()).default([]),
  marks: z.array(z.string()).default([]),
  tags: z.array(z.string().regex(/^[a-z]([a-z-]*[a-z])?$/, "Tags must be lowercase letters and dashes, starting and ending with a letter")).default([]),
  notes: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const createPokemonSchema = pokemonSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const updatePokemonSchema = createPokemonSchema.partial();

export const pokemonFiltersSchema = z.object({
  search: z.string().optional(),
  species: z.string().optional(),

  nature: z.string().optional(),
  ball: z.string().optional(),
  origin_mark: z.string().optional(),
  current_location: z.string().optional(),
  language_tag: z.string().optional(),
  is_shiny: z.boolean().optional(),
  is_event: z.boolean().optional(),
  is_alpha: z.boolean().optional(),
  is_available_for_trade: z.boolean().optional(),
  is_hidden_ability: z.boolean().optional(),
  tag: z.string().optional(),
  sort_by: z.string().default("dex_number"),
  sort_order: z.enum(["asc", "desc"]).default("asc"),
});
