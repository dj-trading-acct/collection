import { Hono } from "hono";
import { getDb } from "../db.js";

const pokemonRoutes = new Hono();

const BOOLEAN_FIELDS = [
  "is_shiny",
  "is_event",
  "is_alpha",
  "is_gigantamax",
  "is_hidden_ability",
] as const;

const ALLOWED_SORT_COLUMNS = [
  "id",
  "species",
  "dex_number",
  "generation",
  "nickname",
  "level",
  "nature",
  "game_of_origin",
  "current_location",
  "poke_ball",
  "created_at",
  "updated_at",
  "is_shiny",
  "is_event",
];

/** Convert a DB row to an API response object */
function rowToApi(row: Record<string, unknown>): Record<string, unknown> {
  const result = { ...row };
  // Parse JSON strings to arrays
  try {
    result.ribbons =
      typeof result.ribbons === "string"
        ? JSON.parse(result.ribbons as string)
        : [];
  } catch {
    result.ribbons = [];
  }
  try {
    result.marks =
      typeof result.marks === "string"
        ? JSON.parse(result.marks as string)
        : [];
  } catch {
    result.marks = [];
  }
  // Convert boolean ints to actual booleans
  for (const field of BOOLEAN_FIELDS) {
    result[field] = result[field] === 1 || result[field] === true;
  }
  return result;
}

function isTruthy(val: string | undefined): boolean {
  return val === "true" || val === "1";
}

// ---- GET /filters — must be before /:id ----
pokemonRoutes.get("/filters", (c) => {
  const db = getDb();

  const species = db
    .prepare("SELECT DISTINCT species FROM pokemon ORDER BY species")
    .all()
    .map((r: any) => r.species);
  const generation = db
    .prepare("SELECT DISTINCT generation FROM pokemon ORDER BY generation")
    .all()
    .map((r: any) => r.generation);
  const nature = db
    .prepare(
      "SELECT DISTINCT nature FROM pokemon WHERE nature IS NOT NULL ORDER BY nature"
    )
    .all()
    .map((r: any) => r.nature);
  const ball = db
    .prepare(
      "SELECT DISTINCT poke_ball FROM pokemon WHERE poke_ball IS NOT NULL ORDER BY poke_ball"
    )
    .all()
    .map((r: any) => r.poke_ball);
  const game_of_origin = db
    .prepare(
      "SELECT DISTINCT game_of_origin FROM pokemon WHERE game_of_origin IS NOT NULL ORDER BY game_of_origin"
    )
    .all()
    .map((r: any) => r.game_of_origin);
  const current_location = db
    .prepare(
      "SELECT DISTINCT current_location FROM pokemon WHERE current_location IS NOT NULL ORDER BY current_location"
    )
    .all()
    .map((r: any) => r.current_location);
  const language_tag = db
    .prepare(
      "SELECT DISTINCT language_tag FROM pokemon WHERE language_tag IS NOT NULL ORDER BY language_tag"
    )
    .all()
    .map((r: any) => r.language_tag);

  return c.json({
    species,
    generation,
    nature,
    ball,
    game_of_origin,
    current_location,
    language_tag,
  });
});

// ---- GET / — list with filtering, sorting, search ----
pokemonRoutes.get("/", (c) => {
  const db = getDb();
  const query = c.req.query();

  const conditions: string[] = [];
  const params: unknown[] = [];

  // Search across species, nickname, ot_name
  if (query.search) {
    conditions.push(
      "(species LIKE ? OR nickname LIKE ? OR ot_name LIKE ?)"
    );
    const like = `%${query.search}%`;
    params.push(like, like, like);
  }

  // Comma-separated multi-select filters
  const multiFilters: Record<string, string> = {
    species: "species",
    generation: "generation",
    nature: "nature",
    ball: "poke_ball",
    game_of_origin: "game_of_origin",
    current_location: "current_location",
    language_tag: "language_tag",
  };

  for (const [param, column] of Object.entries(multiFilters)) {
    if (query[param]) {
      const values = query[param].split(",").map((v) => v.trim());
      const placeholders = values.map(() => "?").join(",");
      conditions.push(`${column} IN (${placeholders})`);
      params.push(...values);
    }
  }

  // Boolean filters
  const boolFilters = ["is_shiny", "is_event", "is_alpha", "is_hidden_ability"];
  for (const param of boolFilters) {
    if (query[param] !== undefined) {
      if (isTruthy(query[param])) {
        conditions.push(`${param} = 1`);
      }
    }
  }

  // Build WHERE clause
  const where =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // Sorting
  let sortBy = query.sort_by || "dex_number";
  if (!ALLOWED_SORT_COLUMNS.includes(sortBy)) {
    sortBy = "dex_number";
  }
  const sortOrder =
    query.sort_order === "desc" ? "DESC" : "ASC";

  const sql = `SELECT * FROM pokemon ${where} ORDER BY ${sortBy} ${sortOrder}`;
  const rows = db.prepare(sql).all(...params) as Record<string, unknown>[];

  return c.json(rows.map(rowToApi));
});

// ---- GET /:id ----
pokemonRoutes.get("/:id", (c) => {
  const db = getDb();
  const id = Number(c.req.param("id"));
  if (isNaN(id)) {
    return c.json({ error: "Invalid id" }, 400);
  }

  const row = db
    .prepare("SELECT * FROM pokemon WHERE id = ?")
    .get(id) as Record<string, unknown> | undefined;

  if (!row) {
    return c.json({ error: "Not found" }, 404);
  }

  return c.json(rowToApi(row));
});

// ---- POST / — create ----
pokemonRoutes.post("/", async (c) => {
  const db = getDb();
  const body = await c.req.json();

  // Validate required fields
  if (!body.species || typeof body.species !== "string") {
    return c.json({ error: "species is required and must be a string" }, 400);
  }
  if (body.dex_number == null || typeof body.dex_number !== "number") {
    return c.json(
      { error: "dex_number is required and must be a number" },
      400
    );
  }
  if (body.generation == null || typeof body.generation !== "number") {
    return c.json(
      { error: "generation is required and must be a number" },
      400
    );
  }

  // Prepare values — convert arrays to JSON, booleans to 0/1
  const ribbons =
    Array.isArray(body.ribbons) ? JSON.stringify(body.ribbons) : "[]";
  const marks =
    Array.isArray(body.marks) ? JSON.stringify(body.marks) : "[]";

  const columns = [
    "species",
    "dex_number",
    "form",
    "generation",
    "nickname",
    "gender",
    "level",
    "nature",
    "mint_nature",
    "ability",
    "is_hidden_ability",
    "ot_name",
    "ot_tid",
    "ot_gender",
    "language_tag",
    "game_of_origin",
    "current_location",
    "is_shiny",
    "is_event",
    "is_alpha",
    "is_gigantamax",
    "poke_ball",
    "ribbons",
    "marks",
    "notes",
  ];

  const values: Record<string, unknown> = {};
  for (const col of columns) {
    if (col === "ribbons") {
      values[col] = ribbons;
    } else if (col === "marks") {
      values[col] = marks;
    } else if (BOOLEAN_FIELDS.includes(col as any)) {
      values[col] = body[col] ? 1 : 0;
    } else {
      values[col] = body[col] ?? null;
    }
  }

  const colNames = columns.join(", ");
  const placeholders = columns.map((col) => `@${col}`).join(", ");

  const result = db
    .prepare(`INSERT INTO pokemon (${colNames}) VALUES (${placeholders})`)
    .run(values);

  const created = db
    .prepare("SELECT * FROM pokemon WHERE id = ?")
    .get(result.lastInsertRowid) as Record<string, unknown>;

  return c.json(rowToApi(created), 201);
});

// ---- PUT /:id — update ----
pokemonRoutes.put("/:id", async (c) => {
  const db = getDb();
  const id = Number(c.req.param("id"));
  if (isNaN(id)) {
    return c.json({ error: "Invalid id" }, 400);
  }

  // Check existence
  const existing = db
    .prepare("SELECT id FROM pokemon WHERE id = ?")
    .get(id);
  if (!existing) {
    return c.json({ error: "Not found" }, 404);
  }

  const body = await c.req.json();

  const updatableColumns = [
    "species",
    "dex_number",
    "form",
    "generation",
    "nickname",
    "gender",
    "level",
    "nature",
    "mint_nature",
    "ability",
    "is_hidden_ability",
    "ot_name",
    "ot_tid",
    "ot_gender",
    "language_tag",
    "game_of_origin",
    "current_location",
    "is_shiny",
    "is_event",
    "is_alpha",
    "is_gigantamax",
    "poke_ball",
    "ribbons",
    "marks",
    "notes",
  ];

  const setClauses: string[] = [];
  const params: Record<string, unknown> = {};

  for (const col of updatableColumns) {
    if (body[col] !== undefined) {
      if (col === "ribbons" || col === "marks") {
        setClauses.push(`${col} = @${col}`);
        params[col] = Array.isArray(body[col])
          ? JSON.stringify(body[col])
          : body[col];
      } else if (BOOLEAN_FIELDS.includes(col as any)) {
        setClauses.push(`${col} = @${col}`);
        params[col] = body[col] ? 1 : 0;
      } else {
        setClauses.push(`${col} = @${col}`);
        params[col] = body[col];
      }
    }
  }

  // Always update updated_at
  setClauses.push("updated_at = datetime('now')");

  if (setClauses.length > 0) {
    params.id = id;
    const sql = `UPDATE pokemon SET ${setClauses.join(", ")} WHERE id = @id`;
    db.prepare(sql).run(params);
  }

  const updated = db
    .prepare("SELECT * FROM pokemon WHERE id = ?")
    .get(id) as Record<string, unknown>;

  return c.json(rowToApi(updated));
});

// ---- DELETE /:id ----
pokemonRoutes.delete("/:id", (c) => {
  const db = getDb();
  const id = Number(c.req.param("id"));
  if (isNaN(id)) {
    return c.json({ error: "Invalid id" }, 400);
  }

  const result = db.prepare("DELETE FROM pokemon WHERE id = ?").run(id);

  if (result.changes === 0) {
    return c.json({ error: "Not found" }, 404);
  }

  return c.body(null, 204);
});

export default pokemonRoutes;
