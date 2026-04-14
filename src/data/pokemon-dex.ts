import { Dex } from '@pkmn/dex';

export interface SpeciesInfo {
  name: string;
  num: number;
  formes: string[];
  abilities: { name: string; isHidden: boolean }[];
}

// Build a cached list of all base species for typeahead
const allBaseSpecies = Dex.species
  .all()
  .filter((s) => (!s.isNonstandard || s.isNonstandard === 'Past') && !s.forme)
  .map((s) => ({ name: s.name, num: s.num }))
  .sort((a, b) => a.num - b.num);

// Index by num for fast reverse lookup
const speciesByNum = new Map<number, string>();
for (const s of allBaseSpecies) {
  speciesByNum.set(s.num, s.name);
}

export function getAllSpecies(): { name: string; num: number }[] {
  return allBaseSpecies;
}

export function getSpeciesByNum(num: number): string | undefined {
  return speciesByNum.get(num);
}

export function getSpeciesInfo(name: string, forme?: string | null): SpeciesInfo | null {
  const species = Dex.species.get(name);
  if (!species.exists) return null;

  // Use base species for formes list and metadata
  const base = species.baseSpecies !== species.name
    ? Dex.species.get(species.baseSpecies)
    : species;

  // Use form-specific species for abilities when a forme is selected
  const abilitySource = forme
    ? Dex.species.get(`${base.name}-${forme}`)
    : species;
  // Fall back to the input species if the forme lookup fails
  const abilitySpecies = abilitySource.exists ? abilitySource : species;

  // Collect formes
  const formes: string[] = [];
  if (base.otherFormes) {
    for (const formeName of base.otherFormes) {
      const formeSpecies = Dex.species.get(formeName);
      if (formeSpecies.exists && !formeSpecies.isNonstandard) {
        formes.push(formeSpecies.forme);
      }
    }
  }
  if (base.cosmeticFormes) {
    for (const formeName of base.cosmeticFormes) {
      const formeSpecies = Dex.species.get(formeName);
      if (formeSpecies.exists) {
        formes.push(formeSpecies.forme);
      }
    }
  }

  // Collect abilities from the form-specific species
  const abilities: { name: string; isHidden: boolean }[] = [];
  const seen = new Set<string>();
  if (abilitySpecies.abilities['0'] && !seen.has(abilitySpecies.abilities['0'])) {
    seen.add(abilitySpecies.abilities['0']);
    abilities.push({ name: abilitySpecies.abilities['0'], isHidden: false });
  }
  if (abilitySpecies.abilities['1'] && !seen.has(abilitySpecies.abilities['1'])) {
    seen.add(abilitySpecies.abilities['1']);
    abilities.push({ name: abilitySpecies.abilities['1'], isHidden: false });
  }
  if (abilitySpecies.abilities['H'] && !seen.has(abilitySpecies.abilities['H'])) {
    seen.add(abilitySpecies.abilities['H']);
    abilities.push({ name: abilitySpecies.abilities['H'], isHidden: true });
  }
  if (abilitySpecies.abilities['S'] && !seen.has(abilitySpecies.abilities['S'])) {
    seen.add(abilitySpecies.abilities['S']);
    abilities.push({ name: abilitySpecies.abilities['S'], isHidden: false });
  }

  return {
    name: base.name,
    num: base.num,
    formes,
    abilities,
  };
}

/**
 * Get a Pokemon Showdown sprite URL for a species, optionally with a form.
 * Falls back to base species if the form lookup fails.
 */
export function getShowdownSpriteUrl(
  speciesName: string,
  forme?: string,
  shiny = false,
): string {
  const dir = shiny ? 'gen5-shiny' : 'gen5';
  const base = `https://play.pokemonshowdown.com/sprites/${dir}`;

  const fullName = forme ? `${speciesName}-${forme}` : speciesName;
  const species = Dex.species.get(fullName);

  if (species.exists) {
    return `${base}/${toShowdownSpriteId(species)}.png`;
  }
  // Fallback to base species
  const baseSpecies = Dex.species.get(speciesName);
  if (baseSpecies.exists) {
    return `${base}/${toShowdownSpriteId(baseSpecies)}.png`;
  }
  return '';
}

function toShowdownSpriteId(species: { baseSpecies: string; forme: string }): string {
  const base = species.baseSpecies.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!species.forme) return base;
  const forme = species.forme.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${base}-${forme}`;
}

/**
 * Get a PokeAPI ball sprite URL from the ball name.
 */
export function getBallSpriteUrl(ballName: string): string {
  const id = ballName.toLowerCase().replace(/\s+/g, '-');
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${id}.png`;
}

/** Map an origin mark value to its display label and region. */
export function getOriginMark(mark: string): { label: string; region: string; sprite: string | null } | null {
  const ORIGIN_MAP: Record<string, { label: string; region: string; sprite: string | null }> = {
    'GB': { label: 'Game Boy', region: 'Kanto/Johto', sprite: '/origin-marks/GB.png' },
    'GO': { label: 'Pokemon GO', region: 'GO', sprite: '/origin-marks/GO.png' },
    'Kalos': { label: 'Kalos', region: 'Kalos', sprite: '/origin-marks/Kalos.png' },
    'Alola': { label: 'Alola', region: 'Alola', sprite: '/origin-marks/Alola.png' },
    'LGPE': { label: "Let's Go", region: 'Kanto', sprite: '/origin-marks/LGPE.png' },
    'SWSH': { label: 'Galar', region: 'Galar', sprite: '/origin-marks/SWSH.png' },
    'BDSP': { label: 'Sinnoh', region: 'Sinnoh', sprite: '/origin-marks/BDSP.png' },
    'PLA': { label: 'Hisui', region: 'Hisui', sprite: '/origin-marks/PLA.png' },
    'SV': { label: 'Paldea', region: 'Paldea', sprite: '/origin-marks/SV.png' },
    'PLZA': { label: 'Kalos', region: 'Kalos', sprite: '/origin-marks/PLZA.png' },
  };
  return ORIGIN_MAP[mark] ?? null;
}

export function searchSpecies(query: string): { name: string; num: number }[] {
  if (!query) return [];
  const lower = query.toLowerCase();
  return allBaseSpecies.filter(
    (s) =>
      s.name.toLowerCase().startsWith(lower) ||
      s.num.toString() === query,
  );
}
