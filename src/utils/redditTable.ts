import type { Pokemon } from "../data/types";

const GENDER_SYMBOL: Record<NonNullable<Pokemon["gender"]>, string> = {
  Male: "♂",
  Female: "♀",
  Genderless: "—",
};

const COLUMNS = [
  "Pokemon",
  "Gender",
  "Nature",
  "Ability",
  "Ball",
  "OT / TID",
  "Lang",
  "Origin",
  "Notes",
] as const;

function escapeCell(value: string | null | undefined): string {
  if (!value) return "";
  return value.replace(/\|/g, "\\|").replace(/\r?\n/g, " ").trim();
}

function pokemonLabel(p: Pokemon): string {
  const parts: string[] = [];
  const base = p.form ? `${p.species} (${p.form})` : p.species;
  parts.push(base);
  if (p.is_shiny) parts.push("⭐");
  if (p.nickname && p.nickname.trim() && p.nickname.trim() !== p.species) {
    parts.push(`"${p.nickname.trim()}"`);
  }
  return parts.join(" ");
}

function abilityLabel(p: Pokemon): string {
  if (!p.ability) return "";
  return p.is_hidden_ability ? `${p.ability} (HA)` : p.ability;
}

function otLabel(p: Pokemon): string {
  const name = p.ot_name?.trim() ?? "";
  const tid = p.ot_tid?.trim() ?? "";
  if (!name && !tid) return "";
  if (!tid) return name;
  if (!name) return tid;
  return `${name} / ${tid}`;
}

function notesLabel(p: Pokemon): string {
  const tags: string[] = [];
  if (p.is_event) tags.push("Event");
  if (p.is_alpha) tags.push("Alpha");
  const notes = p.notes?.trim();
  if (notes) tags.push(notes);
  return tags.join("; ");
}

function rowFor(p: Pokemon): string[] {
  return [
    pokemonLabel(p),
    p.gender ? GENDER_SYMBOL[p.gender] : "",
    p.nature ?? "",
    abilityLabel(p),
    p.poke_ball ?? "",
    otLabel(p),
    p.language_tag ?? "",
    p.origin_mark ?? "",
    notesLabel(p),
  ].map(escapeCell);
}

function toRow(cells: readonly string[]): string {
  return `| ${cells.join(" | ")} |`;
}

export function formatPokemonAsRedditTable(pokemon: Pokemon[]): string {
  const header = toRow(COLUMNS);
  const separator = `|${COLUMNS.map(() => ":---:").join("|")}|`;
  const rows = pokemon.map((p) => toRow(rowFor(p)));
  return [header, separator, ...rows].join("\n");
}
