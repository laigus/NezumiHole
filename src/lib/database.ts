import type { AppDataSnapshot, Category, FoodItem, SyncEntityType, SyncTombstone } from "@/types";
import { randomIllustration } from "@/types";
import { initialCategories } from "@/data/initial-categories";
import { initialFoods } from "@/data/initial-foods";

function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

// ==================== SQLite Backend (Tauri) ====================

let sqliteDb: Awaited<ReturnType<typeof import("@tauri-apps/plugin-sql")["default"]["load"]>> | null = null;

async function getSqliteDb() {
  if (!sqliteDb) {
    const Database = (await import("@tauri-apps/plugin-sql")).default;
    const db = await Database.load("sqlite:nezumihole.db");
    sqliteDb = db;
    try {
      await initSqliteTables();
    } catch (e) {
      sqliteDb = null;
      throw e;
    }
  }
  return sqliteDb;
}

async function initSqliteTables() {
  const db = sqliteDb!;
  await db.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT '',
      parentId TEXT,
      sortOrder INTEGER NOT NULL DEFAULT 0
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS food_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      categoryId TEXT NOT NULL,
      region TEXT,
      location TEXT,
      source TEXT,
      items TEXT NOT NULL DEFAULT '[]',
      rating REAL,
      notes TEXT,
      images TEXT NOT NULL DEFAULT '[]',
      illustration INTEGER NOT NULL DEFAULT 1,
      isFavorite INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS sync_tombstones (
      entityType TEXT NOT NULL,
      id TEXT NOT NULL,
      deletedAt TEXT NOT NULL,
      PRIMARY KEY (entityType, id)
    )
  `);

  try {
    await db.execute("ALTER TABLE food_items ADD COLUMN illustration INTEGER NOT NULL DEFAULT 1");
  } catch { /* column already exists */ }
  try {
    await db.execute("ALTER TABLE categories ADD COLUMN updatedAt TEXT NOT NULL DEFAULT ''");
  } catch { /* column already exists */ }

  const countResult = await db.select<{ count: number }[]>(
    "SELECT COUNT(*) as count FROM categories",
  );
  if (countResult[0].count === 0) {
    await seedSqliteData();
  }
}

async function sqlInsertFood(db: NonNullable<typeof sqliteDb>, food: FoodItem) {
  await db.execute(
    `INSERT OR REPLACE INTO food_items
       (id, name, categoryId, items, illustration, isFavorite, createdAt, updatedAt)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [food.id, food.name, food.categoryId,
     JSON.stringify(food.items), food.illustration ?? randomIllustration(),
     food.isFavorite ? 1 : 0, food.createdAt, food.updatedAt],
  );
  await db.execute(
    `UPDATE food_items
     SET region = $1, location = $2, source = $3, rating = $4, notes = $5, images = $6
     WHERE id = $7`,
    [food.region, food.location, food.source, food.rating, food.notes,
     JSON.stringify(food.images), food.id],
  );
  await db.execute("DELETE FROM sync_tombstones WHERE entityType = 'food' AND id = $1", [food.id]);
}

async function sqlInsertCategory(db: NonNullable<typeof sqliteDb>, cat: Category) {
  await db.execute(
    "INSERT OR REPLACE INTO categories (id, name, icon, parentId, sortOrder, updatedAt) VALUES ($1, $2, $3, $4, $5, $6)",
    [cat.id, cat.name, cat.icon, cat.parentId, cat.sortOrder, cat.updatedAt || new Date().toISOString()],
  );
  await db.execute("DELETE FROM sync_tombstones WHERE entityType = 'category' AND id = $1", [cat.id]);
}

async function upsertTombstone(entityType: SyncEntityType, id: string, deletedAt = new Date().toISOString()) {
  if (!isTauri()) {
    memTombstones = mergeTombstones(memTombstones, [{ entityType, id, deletedAt }]);
    return;
  }
  const db = await getSqliteDb();
  await db.execute(
    `INSERT INTO sync_tombstones (entityType, id, deletedAt)
     VALUES ($1, $2, $3)
     ON CONFLICT(entityType, id) DO UPDATE SET deletedAt = excluded.deletedAt
     WHERE excluded.deletedAt > sync_tombstones.deletedAt`,
    [entityType, id, deletedAt],
  );
}

async function seedSqliteData() {
  const db = sqliteDb!;
  for (const cat of initialCategories) {
    try {
      await sqlInsertCategory(db, cat);
    } catch (e) {
      console.error(`[seed] category ${cat.id} failed:`, e);
    }
  }
  let ok = 0;
  let fail = 0;
  for (const food of initialFoods) {
    try {
      const f = { ...food, illustration: randomIllustration() };
      await sqlInsertFood(db, f);
      ok++;
    } catch (e) {
      fail++;
      console.error(`[seed] food ${food.id} failed:`, e);
    }
  }
  console.log(`[seed] done: ${ok} ok, ${fail} failed out of ${initialFoods.length}`);
}

interface RawFoodRow {
  id: string; name: string; categoryId: string;
  region: string | null; location: string | null; source: string | null;
  items: string; rating: number | null; notes: string | null;
  images: string; illustration: number; isFavorite: number; createdAt: string; updatedAt: string;
}

function rowToFoodItem(row: RawFoodRow): FoodItem {
  return { ...row, items: JSON.parse(row.items || "[]"), images: JSON.parse(row.images || "[]"), illustration: row.illustration || 1, isFavorite: row.isFavorite === 1 };
}

// ==================== In-Memory Backend (Browser Dev) ====================

let memCategories: Category[] = [...initialCategories];
let memFoods: FoodItem[] = [...initialFoods];
let memTombstones: SyncTombstone[] = [];

function mergeTombstones(existing: SyncTombstone[], incoming: SyncTombstone[]) {
  const byKey = new Map<string, SyncTombstone>();
  for (const item of [...existing, ...incoming]) {
    const key = `${item.entityType}:${item.id}`;
    const current = byKey.get(key);
    if (!current || item.deletedAt > current.deletedAt) {
      byKey.set(key, item);
    }
  }
  return [...byKey.values()];
}

// ==================== Unified API ====================

export async function fetchCategories(): Promise<Category[]> {
  if (!isTauri()) return [...memCategories].sort((a, b) => a.sortOrder - b.sortOrder);
  const db = await getSqliteDb();
  return db.select<Category[]>("SELECT * FROM categories ORDER BY sortOrder");
}

export async function fetchTombstones(): Promise<SyncTombstone[]> {
  if (!isTauri()) return [...memTombstones];
  const db = await getSqliteDb();
  return db.select<SyncTombstone[]>("SELECT entityType, id, deletedAt FROM sync_tombstones");
}

export async function fetchFoods(): Promise<FoodItem[]> {
  if (!isTauri()) return [...memFoods];
  const db = await getSqliteDb();
  const rows = await db.select<RawFoodRow[]>("SELECT * FROM food_items ORDER BY createdAt DESC");
  return rows.map(rowToFoodItem);
}

export async function insertCategory(cat: Category): Promise<void> {
  const withUpdatedAt = { ...cat, updatedAt: cat.updatedAt || new Date().toISOString() };
  if (!isTauri()) {
    memCategories.push(withUpdatedAt);
    memTombstones = memTombstones.filter((t) => !(t.entityType === "category" && t.id === cat.id));
    return;
  }
  const db = await getSqliteDb();
  await sqlInsertCategory(db, withUpdatedAt);
}

export async function updateCategory(id: string, updates: Partial<Category>): Promise<void> {
  const updatedAt = new Date().toISOString();
  if (!isTauri()) {
    memCategories = memCategories.map((c) => (c.id === id ? { ...c, ...updates, updatedAt } : c));
    return;
  }
  const db = await getSqliteDb();
  const fields: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  if (updates.name !== undefined) { fields.push(`name = $${i++}`); values.push(updates.name); }
  if (updates.icon !== undefined) { fields.push(`icon = $${i++}`); values.push(updates.icon); }
  if (updates.parentId !== undefined) { fields.push(`parentId = $${i++}`); values.push(updates.parentId); }
  if (updates.sortOrder !== undefined) { fields.push(`sortOrder = $${i++}`); values.push(updates.sortOrder); }
  fields.push(`updatedAt = $${i++}`); values.push(updatedAt);
  if (fields.length > 0) {
    values.push(id);
    await db.execute(`UPDATE categories SET ${fields.join(", ")} WHERE id = $${i}`, values);
  }
}

export async function deleteCategory(id: string): Promise<void> {
  if (!isTauri()) {
    memCategories = memCategories.filter((c) => c.id !== id);
    await upsertTombstone("category", id);
    return;
  }
  const db = await getSqliteDb();
  await db.execute("DELETE FROM categories WHERE id = $1", [id]);
  await upsertTombstone("category", id);
}

export async function insertFood(food: FoodItem): Promise<void> {
  if (!isTauri()) {
    memFoods.unshift(food);
    memTombstones = memTombstones.filter((t) => !(t.entityType === "food" && t.id === food.id));
    return;
  }
  const db = await getSqliteDb();
  await sqlInsertFood(db, food);
}

export async function updateFoodItem(id: string, updates: Partial<FoodItem>): Promise<void> {
  if (!isTauri()) {
    memFoods = memFoods.map((f) => (f.id === id ? { ...f, ...updates, updatedAt: new Date().toISOString() } : f));
    return;
  }
  const db = await getSqliteDb();
  const now = new Date().toISOString();
  const fields: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  if (updates.name !== undefined) { fields.push(`name = $${i++}`); values.push(updates.name); }
  if (updates.categoryId !== undefined) { fields.push(`categoryId = $${i++}`); values.push(updates.categoryId); }
  if (updates.region !== undefined) { fields.push(`region = $${i++}`); values.push(updates.region); }
  if (updates.location !== undefined) { fields.push(`location = $${i++}`); values.push(updates.location); }
  if (updates.source !== undefined) { fields.push(`source = $${i++}`); values.push(updates.source); }
  if (updates.items !== undefined) { fields.push(`items = $${i++}`); values.push(JSON.stringify(updates.items)); }
  if (updates.rating !== undefined) { fields.push(`rating = $${i++}`); values.push(updates.rating); }
  if (updates.notes !== undefined) { fields.push(`notes = $${i++}`); values.push(updates.notes); }
  if (updates.images !== undefined) { fields.push(`images = $${i++}`); values.push(JSON.stringify(updates.images)); }
  if (updates.illustration !== undefined) { fields.push(`illustration = $${i++}`); values.push(updates.illustration); }
  if (updates.isFavorite !== undefined) { fields.push(`isFavorite = $${i++}`); values.push(updates.isFavorite ? 1 : 0); }
  fields.push(`updatedAt = $${i++}`); values.push(now);
  if (fields.length > 0) {
    values.push(id);
    await db.execute(`UPDATE food_items SET ${fields.join(", ")} WHERE id = $${i}`, values);
  }
}

export async function deleteFoodItem(id: string): Promise<void> {
  if (!isTauri()) {
    memFoods = memFoods.filter((f) => f.id !== id);
    await upsertTombstone("food", id);
    return;
  }
  const db = await getSqliteDb();
  await db.execute("DELETE FROM food_items WHERE id = $1", [id]);
  await upsertTombstone("food", id);
}

export async function toggleFoodFavorite(id: string): Promise<boolean> {
  if (!isTauri()) {
    const food = memFoods.find((f) => f.id === id);
    if (!food) return false;
    food.isFavorite = !food.isFavorite;
    food.updatedAt = new Date().toISOString();
    return food.isFavorite;
  }
  const db = await getSqliteDb();
  const rows = await db.select<{ isFavorite: number }[]>("SELECT isFavorite FROM food_items WHERE id = $1", [id]);
  if (rows.length === 0) return false;
  const newVal = rows[0].isFavorite === 1 ? 0 : 1;
  await db.execute("UPDATE food_items SET isFavorite = $1, updatedAt = $2 WHERE id = $3", [newVal, new Date().toISOString(), id]);
  return newVal === 1;
}

export async function exportAllData(): Promise<string> {
  const categories = await fetchCategories();
  const foods = await fetchFoods();
  const tombstones = await fetchTombstones();
  return JSON.stringify({ schemaVersion: 2, categories, foods, tombstones }, null, 2);
}

export async function importData(jsonStr: string): Promise<{ categories: number; foods: number }> {
  const data = JSON.parse(jsonStr) as AppDataSnapshot;
  const tombstones = data.tombstones || [];
  if (!isTauri()) {
    memCategories = data.categories.map((cat) => ({ ...cat, updatedAt: cat.updatedAt || new Date().toISOString() }));
    memFoods = data.foods;
    memTombstones = tombstones;
    return { categories: data.categories.length, foods: data.foods.length };
  }
  const db = await getSqliteDb();
  await db.execute("DELETE FROM food_items");
  await db.execute("DELETE FROM categories");
  await db.execute("DELETE FROM sync_tombstones");
  for (const cat of data.categories) {
    await sqlInsertCategory(db, cat);
  }
  for (const food of data.foods) {
    const f = { ...food, illustration: food.illustration || randomIllustration() };
    await sqlInsertFood(db, f);
  }
  for (const tombstone of tombstones) {
    await db.execute(
      "INSERT OR REPLACE INTO sync_tombstones (entityType, id, deletedAt) VALUES ($1, $2, $3)",
      [tombstone.entityType, tombstone.id, tombstone.deletedAt],
    );
  }
  return { categories: data.categories.length, foods: data.foods.length };
}
