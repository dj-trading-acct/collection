export const APP_NAME = "Pokemon Collection Tracker";

export const NATURES = [
  'Adamant', 'Bashful', 'Bold', 'Brave', 'Calm',
  'Careful', 'Docile', 'Gentle', 'Hardy', 'Hasty',
  'Impish', 'Jolly', 'Lax', 'Lonely', 'Mild',
  'Modest', 'Naive', 'Naughty', 'Quiet', 'Quirky',
  'Rash', 'Relaxed', 'Sassy', 'Serious', 'Timid',
] as const;

export const POKE_BALLS = [
  'Poke Ball', 'Great Ball', 'Ultra Ball', 'Master Ball',
  'Beast Ball', 'Cherish Ball', 'Dive Ball', 'Dream Ball',
  'Dusk Ball', 'Fast Ball', 'Friend Ball', 'Heal Ball',
  'Heavy Ball', 'Level Ball', 'Love Ball', 'Lure Ball',
  'Luxury Ball', 'Moon Ball', 'Nest Ball', 'Net Ball',
  'Park Ball', 'Premier Ball', 'Quick Ball', 'Repeat Ball',
  'Safari Ball', 'Sport Ball', 'Strange Ball', 'Timer Ball',
] as const;

export const LANGUAGES = [
  'JPN', 'ENG', 'FRE', 'GER', 'ITA', 'SPA', 'KOR', 'CHS', 'CHT',
] as const;

export const ORIGIN_MARKS = [
  { value: 'None', label: 'No Origin Mark', sprite: null },
  { value: 'GB', label: 'Game Boy (VC)', sprite: '/origin-marks/GB.png' },
  { value: 'GO', label: 'Pokemon GO', sprite: '/origin-marks/GO.png' },
  { value: 'Kalos', label: 'Gen VI (X/Y, ORAS)', sprite: '/origin-marks/Kalos.png' },
  { value: 'Alola', label: 'Gen VII (SM, USUM)', sprite: '/origin-marks/Alola.png' },
  { value: 'LGPE', label: "Let's Go Pikachu & Eevee", sprite: '/origin-marks/LGPE.png' },
  { value: 'SWSH', label: 'Sword & Shield', sprite: '/origin-marks/SWSH.png' },
  { value: 'BDSP', label: 'Brilliant Diamond & Shining Pearl', sprite: '/origin-marks/BDSP.png' },
  { value: 'PLA', label: 'Legends: Arceus', sprite: '/origin-marks/PLA.png' },
  { value: 'SV', label: 'Scarlet & Violet', sprite: '/origin-marks/SV.png' },
  { value: 'PLZA', label: 'Legends: Z-A', sprite: '/origin-marks/PLZA.png' },
] as const;

export const GENDERS = ['Male', 'Female', 'Genderless'] as const;

export const GAME_LOCATIONS = [
  // Services
  { name: 'Home', boxArt: '/box-art/home.png' },
  // Standalone
  { name: 'Champions', boxArt: '/box-art/champions.png' },
  // Gen IX
  { name: 'Legends: Z-A', boxArt: '/box-art/legends-za.png' },
  { name: 'Violet', boxArt: '/box-art/violet.png' },
  { name: 'Scarlet', boxArt: '/box-art/scarlet.png' },
  // Gen VIII
  { name: 'Legends: Arceus', boxArt: '/box-art/legends-arceus.png' },
  { name: 'Shining Pearl', boxArt: '/box-art/shining-pearl.png' },
  { name: 'Brilliant Diamond', boxArt: '/box-art/brilliant-diamond.png' },
  { name: 'Shield', boxArt: '/box-art/shield.png' },
  { name: 'Sword', boxArt: '/box-art/sword.png' },
  // Gen VII
  { name: "Let's Go, Eevee!", boxArt: '/box-art/lets-go-eevee.png' },
  { name: "Let's Go, Pikachu!", boxArt: '/box-art/lets-go-pikachu.png' },
  { name: 'Ultra Moon', boxArt: '/box-art/ultra-moon.png' },
  { name: 'Ultra Sun', boxArt: '/box-art/ultra-sun.png' },
  { name: 'Moon', boxArt: '/box-art/moon.png' },
  { name: 'Sun', boxArt: '/box-art/sun.png' },
  // Gen VI
  { name: 'Alpha Sapphire', boxArt: '/box-art/alpha-sapphire.png' },
  { name: 'Omega Ruby', boxArt: '/box-art/omega-ruby.png' },
  { name: 'Y', boxArt: '/box-art/y.png' },
  { name: 'X', boxArt: '/box-art/x.png' },
  // Gen V
  { name: 'White 2', boxArt: '/box-art/white2.png' },
  { name: 'Black 2', boxArt: '/box-art/black2.png' },
  { name: 'White', boxArt: '/box-art/white.png' },
  { name: 'Black', boxArt: '/box-art/black.png' },
  // Gen IV
  { name: 'SoulSilver', boxArt: '/box-art/soulsilver.jpg' },
  { name: 'HeartGold', boxArt: '/box-art/heartgold.jpg' },
  { name: 'Platinum', boxArt: '/box-art/platinum.png' },
  { name: 'Pearl', boxArt: '/box-art/pearl.jpg' },
  { name: 'Diamond', boxArt: '/box-art/diamond.jpg' },
  // Gen III
  { name: 'XD: Gale of Darkness', boxArt: '/box-art/xd.jpg' },
  { name: 'Colosseum', boxArt: '/box-art/colosseum.png' },
  { name: 'LeafGreen', boxArt: '/box-art/leafgreen.png' },
  { name: 'FireRed', boxArt: '/box-art/firered.png' },
  { name: 'Emerald', boxArt: '/box-art/emerald.jpg' },
  { name: 'Sapphire', boxArt: '/box-art/sapphire.png' },
  { name: 'Ruby', boxArt: '/box-art/ruby.png' },
  // Gen II
  { name: 'Crystal', boxArt: '/box-art/crystal.png' },
  { name: 'Silver', boxArt: '/box-art/silver.png' },
  { name: 'Gold', boxArt: '/box-art/gold.png' },
  // Gen I
  { name: 'Yellow', boxArt: '/box-art/yellow.png' },
  { name: 'Blue', boxArt: '/box-art/blue.png' },
  { name: 'Red', boxArt: '/box-art/red.png' },
  // Services (legacy)
  { name: 'Bank', boxArt: '/box-art/bank.png' },
] as const;
