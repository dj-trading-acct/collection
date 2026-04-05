import { z } from "zod";

const genderEnum = z.enum(["male", "female", "genderless"]);
const otGenderEnum = z.enum(["male", "female"]);
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
  id: z.number(),
  species: z.string(),
  dex_number: z.number().int(),
  form: z.string().nullable().optional(),
  generation: z.number().int(),
  nickname: z.string().nullable().optional(),
  gender: genderEnum.nullable().optional(),
  level: z.number().int().min(1).max(100).nullable().optional(),
  nature: z.string().nullable().optional(),
  mint_nature: z.string().nullable().optional(),
  ability: z.string().nullable().optional(),
  is_hidden_ability: z.boolean().default(false),
  ot_name: z.string().nullable().optional(),
  ot_tid: z.string().nullable().optional(),
  ot_gender: otGenderEnum.nullable().optional(),
  language_tag: languageTagEnum.nullable().optional(),
  game_of_origin: z.string().nullable().optional(),
  current_location: z.string().nullable().optional(),
  is_shiny: z.boolean().default(false),
  is_event: z.boolean().default(false),
  is_alpha: z.boolean().default(false),
  is_gigantamax: z.boolean().default(false),
  poke_ball: z.string().nullable().optional(),
  ribbons: z.array(z.string()).default([]),
  marks: z.array(z.string()).default([]),
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
  generation: z.string().optional(),
  nature: z.string().optional(),
  ball: z.string().optional(),
  game_of_origin: z.string().optional(),
  current_location: z.string().optional(),
  language_tag: z.string().optional(),
  is_shiny: z.boolean().optional(),
  is_event: z.boolean().optional(),
  is_alpha: z.boolean().optional(),
  is_hidden_ability: z.boolean().optional(),
  sort_by: z.string().default("dex_number"),
  sort_order: z.enum(["asc", "desc"]).default("asc"),
  group_by: z.string().optional(),
});
