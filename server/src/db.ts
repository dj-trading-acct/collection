import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, "../data");
const DB_PATH = path.join(DATA_DIR, "collection.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  // Ensure data directory exists
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  // Run migrations
  migrate(db);

  return db;
}

function migrate(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS pokemon (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      species       TEXT NOT NULL,
      dex_number    INTEGER NOT NULL,
      form          TEXT,
      generation    INTEGER NOT NULL,
      nickname      TEXT,
      gender        TEXT CHECK(gender IN ('male','female','genderless')),
      level         INTEGER CHECK(level BETWEEN 1 AND 100),
      nature        TEXT,
      mint_nature   TEXT,
      ability       TEXT,
      is_hidden_ability BOOLEAN DEFAULT 0,
      ot_name       TEXT,
      ot_tid        TEXT,
      ot_gender     TEXT CHECK(ot_gender IN ('male','female')),
      language_tag  TEXT,
      game_of_origin TEXT,
      current_location TEXT,
      is_shiny      BOOLEAN DEFAULT 0,
      is_event      BOOLEAN DEFAULT 0,
      is_alpha      BOOLEAN DEFAULT 0,
      is_gigantamax BOOLEAN DEFAULT 0,
      poke_ball     TEXT,
      ribbons       TEXT DEFAULT '[]',
      marks         TEXT DEFAULT '[]',
      notes         TEXT,
      created_at    TEXT DEFAULT (datetime('now')),
      updated_at    TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_pokemon_species ON pokemon(species);
    CREATE INDEX IF NOT EXISTS idx_pokemon_dex_number ON pokemon(dex_number);
    CREATE INDEX IF NOT EXISTS idx_pokemon_game_origin ON pokemon(game_of_origin);
    CREATE INDEX IF NOT EXISTS idx_pokemon_current_location ON pokemon(current_location);
    CREATE INDEX IF NOT EXISTS idx_pokemon_is_shiny ON pokemon(is_shiny);
  `);
}
