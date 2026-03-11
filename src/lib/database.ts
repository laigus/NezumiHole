import type { Category, FoodItem } from "@/types";
import { initialCategories } from "@/data/initial-categories";
import { initialFoods } from "@/data/initial-foods";

// Check if running inside Tauri
function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

// ==================== SQLite Backend (Tauri) ====================

let sqliteDb: Awaited<ReturnType<typeof import("@tauri-apps/plugin-sql")["default"]["load"]>> | null = null;

async function getSqliteDb() {
  if (!sqliteDb) {
    const Database = (await import("@tauri-apps/plugin-sql")).default;
    sqliteDb = await Database.load("sqlite:nezumihole.db");
    await initSqliteTables();
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
      sortOrder INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (parentId) REFERENCES categories(id) ON DELETE SET NULL
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
      isFavorite INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE CASCADE
    )
  `);

  const countResult = await db.select<{ count: number }[]>(
    "SELECT COUNT(*) as count FROM categories",
  );
  if (countResult[0].count === 0) {
    await seedSqliteData();
  }
}

async function seedSqliteData() {
  const db = sqliteDb!;
  for (const cat of initialCategories) {
    await db.execute(
      "INSERT INTO categories (id, name, icon, parentId, sortOrder) VALUES ($1, $2, $3, $4, $5)",
      [cat.id, cat.name, cat.icon, cat.parentId, cat.sortOrder],
    );
  }
  for (const food of initialFoods) {
    await db.execute(
      `INSERT INTO food_items (id, name, categoryId, region, location, source, items, rating, notes, images, isFavorite, createdAt, updatedAt)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [food.id, food.name, food.categoryId, food.region, food.location, food.source,
       JSON.stringify(food.items), food.rating, food.notes, JSON.stringify(food.images),
       food.isFavorite ? 1 : 0, food.createdAt, food.updatedAt],
    );
  }
}

interface RawFoodRow {
  id: string; name: string; categoryId: string;
  region: string | null; location: string | null; source: string | null;
  items: string; rating: number | null; notes: string | null;
  images: string; isFavorite: number; createdAt: string; updatedAt: string;
}

function rowToFoodItem(row: RawFoodRow): FoodItem {
  return { ...row, items: JSON.parse(row.items || "[]"), images: JSON.parse(row.images || "[]"), isFavorite: row.isFavorite === 1 };
}

// ==================== In-Memory Backend (Browser Dev) ====================

let memCategories: Category[] = [...initialCategories];
let memFoods: FoodItem[] = [...initialFoods];

// ==================== Unified API ====================

export async function fetchCategories(): Promise<Category[]> {
  if (!isTauri()) return [...memCategories].sort((a, b) => a.sortOrder - b.sortOrder);
  const db = await getSqliteDb();
  return db.select<Category[]>("SELECT * FROM categories ORDER BY sortOrder");
}

export async function fetchFoods(): Promise<FoodItem[]> {
  if (!isTauri()) return [...memFoods];
  const db = await getSqliteDb();
  const rows = await db.select<RawFoodRow[]>("SELECT * FROM food_items ORDER BY createdAt DESC");
  return rows.map(rowToFoodItem);
}

export async function insertCategory(cat: Category): Promise<void> {
  if (!isTauri()) { memCategories.push(cat); return; }
  const db = await getSqliteDb();
  await db.execute(
    "INSERT INTO categories (id, name, icon, parentId, sortOrder) VALUES ($1, $2, $3, $4, $5)",
    [cat.id, cat.name, cat.icon, cat.parentId, cat.sortOrder],
  );
}

export async function updateCategory(id: string, updates: Partial<Category>): Promise<void> {
  if (!isTauri()) {
    memCategories = memCategories.map((c) => (c.id === id ? { ...c, ...updates } : c));
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
  if (fields.length > 0) {
    values.push(id);
    await db.execute(`UPDATE categories SET ${fields.join(", ")} WHERE id = $${i}`, values);
  }
}

export async function deleteCategory(id: string): Promise<void> {
  if (!isTauri()) { memCategories = memCategories.filter((c) => c.id !== id); return; }
  const db = await getSqliteDb();
  await db.execute("DELETE FROM categories WHERE id = $1", [id]);
}

export async function insertFood(food: FoodItem): Promise<void> {
  if (!isTauri()) { memFoods.unshift(food); return; }
  const db = await getSqliteDb();
  await db.execute(
    `INSERT INTO food_items (id, name, categoryId, region, location, source, items, rating, notes, images, isFavorite, createdAt, updatedAt)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
    [food.id, food.name, food.categoryId, food.region, food.location, food.source,
     JSON.stringify(food.items), food.rating, food.notes, JSON.stringify(food.images),
     food.isFavorite ? 1 : 0, food.createdAt, food.updatedAt],
  );
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
  if (updates.isFavorite !== undefined) { fields.push(`isFavorite = $${i++}`); values.push(updates.isFavorite ? 1 : 0); }
  fields.push(`updatedAt = $${i++}`); values.push(now);
  if (fields.length > 0) {
    values.push(id);
    await db.execute(`UPDATE food_items SET ${fields.join(", ")} WHERE id = $${i}`, values);
  }
}

export async function deleteFoodItem(id: string): Promise<void> {
  if (!isTauri()) { memFoods = memFoods.filter((f) => f.id !== id); return; }
  const db = await getSqliteDb();
  await db.execute("DELETE FROM food_items WHERE id = $1", [id]);
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
  return JSON.stringify({ categories, foods }, null, 2);
}

export async function importData(jsonStr: string): Promise<{ categories: number; foods: number }> {
  const data = JSON.parse(jsonStr) as { categories: Category[]; foods: FoodItem[] };
  if (!isTauri()) {
    memCategories = data.categories;
    memFoods = data.foods;
    return { categories: data.categories.length, foods: data.foods.length };
  }
  const db = await getSqliteDb();
  await db.execute("DELETE FROM food_items");
  await db.execute("DELETE FROM categories");
  for (const cat of data.categories) {
    await db.execute(
      "INSERT INTO categories (id, name, icon, parentId, sortOrder) VALUES ($1, $2, $3, $4, $5)",
      [cat.id, cat.name, cat.icon, cat.parentId, cat.sortOrder],
    );
  }
  for (const food of data.foods) {
    await db.execute(
      `INSERT INTO food_items (id, name, categoryId, region, location, source, items, rating, notes, images, isFavorite, createdAt, updatedAt)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [food.id, food.name, food.categoryId, food.region, food.location, food.source,
       JSON.stringify(food.items), food.rating, food.notes, JSON.stringify(food.images),
       food.isFavorite ? 1 : 0, food.createdAt, food.updatedAt],
    );
  }
  return { categories: data.categories.length, foods: data.foods.length };
}
