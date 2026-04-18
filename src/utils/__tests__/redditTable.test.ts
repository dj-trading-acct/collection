import { describe, it, expect } from "vitest";
import { formatPokemonAsRedditTable } from "../redditTable";
import type { Pokemon } from "../../data/types";

function makePokemon(overrides: Partial<Pokemon> = {}): Pokemon {
  return {
    id: "abc1",
    species: "Pikachu",
    dex_number: 25,
    is_hidden_ability: false,
    is_shiny: false,
    is_event: false,
    is_alpha: false,
    is_available_for_trade: false,
    ribbons: [],
    marks: [],
    tags: [],
    ...overrides,
  };
}

describe("formatPokemonAsRedditTable", () => {
  it("emits header + separator even with no rows", () => {
    const out = formatPokemonAsRedditTable([]);
    const [header, separator] = out.split("\n");
    expect(header.startsWith("| ")).toBe(true);
    expect(header.endsWith(" |")).toBe(true);
    expect(header).toContain("Pokemon");
    expect(header).toContain("OT / TID");
    expect(separator).toBe("|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|");
  });

  it("formats a fully-populated shiny with HA and nickname", () => {
    const p = makePokemon({
      species: "Charizard",
      nickname: "Blaze",
      gender: "Male",
      nature: "Adamant",
      ability: "Solar Power",
      is_hidden_ability: true,
      poke_ball: "Master Ball",
      ot_name: "Ash",
      ot_tid: "123456",
      language_tag: "ENG",
      origin_mark: "SV",
      is_shiny: true,
      notes: "Tera Type: Dragon",
    });
    const row = formatPokemonAsRedditTable([p]).split("\n")[2];
    expect(row).toBe(
      '| Charizard ⭐ "Blaze" | ♂ | Adamant | Solar Power (HA) | Master Ball | Ash / 123456 | ENG | SV | Tera Type: Dragon |',
    );
  });

  it("omits nickname when it matches species", () => {
    const p = makePokemon({ species: "Pikachu", nickname: "Pikachu" });
    const row = formatPokemonAsRedditTable([p]).split("\n")[2];
    expect(row.startsWith("| Pikachu |")).toBe(true);
  });

  it("prepends form in parens and keeps shiny star", () => {
    const p = makePokemon({ species: "Charizard", form: "Mega X", is_shiny: true });
    const row = formatPokemonAsRedditTable([p]).split("\n")[2];
    expect(row.startsWith("| Charizard (Mega X) ⭐ |")).toBe(true);
  });

  it("combines event/alpha flags with user notes", () => {
    const p = makePokemon({ is_event: true, is_alpha: true, notes: "Pokemon HOME gift" });
    const row = formatPokemonAsRedditTable([p]).split("\n")[2];
    expect(row.endsWith("Event; Alpha; Pokemon HOME gift |")).toBe(true);
  });

  it("escapes pipes and flattens newlines in notes", () => {
    const p = makePokemon({ notes: "line1 | with pipe\nline2" });
    const row = formatPokemonAsRedditTable([p]).split("\n")[2];
    expect(row).toContain("line1 \\| with pipe line2");
  });

  it("OT column handles missing name or tid gracefully", () => {
    const nameOnly = makePokemon({ ot_name: "Ash" });
    expect(formatPokemonAsRedditTable([nameOnly]).split("\n")[2]).toContain("| Ash |");

    const tidOnly = makePokemon({ ot_tid: "12345" });
    expect(formatPokemonAsRedditTable([tidOnly]).split("\n")[2]).toContain("| 12345 |");

    const neither = makePokemon();
    expect(formatPokemonAsRedditTable([neither]).split("\n")[2]).toContain("|  |  |  |");
  });

  it("produces one row per pokemon", () => {
    const list = [
      makePokemon({ id: "a", species: "Bulbasaur" }),
      makePokemon({ id: "b", species: "Squirtle" }),
      makePokemon({ id: "c", species: "Charmander" }),
    ];
    expect(formatPokemonAsRedditTable(list).split("\n")).toHaveLength(5);
  });
});
