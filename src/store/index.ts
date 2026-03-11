import { useState, useEffect, useCallback, useMemo } from "react";
import type { Category, FoodItem } from "@/types";
import {
  fetchCategories,
  fetchFoods,
  insertFood,
  updateFoodItem,
  deleteFoodItem,
  toggleFoodFavorite,
  insertCategory,
  updateCategory,
  deleteCategory,
  exportAllData,
  importData,
} from "@/lib/database";
import { v4 as uuidv4 } from "uuid";

export function useAppStore() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [cats, items] = await Promise.all([fetchCategories(), fetchFoods()]);
      setCategories(cats);
      setFoods(items);
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const topCategories = useMemo(
    () =>
      categories
        .filter((c) => c.parentId === null)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [categories],
  );

  const getSubCategories = useCallback(
    (parentId: string) =>
      categories
        .filter((c) => c.parentId === parentId)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [categories],
  );

  const filteredFoods = useMemo(() => {
    let result = foods;
    if (selectedSubCategoryId) {
      result = result.filter((f) => f.categoryId === selectedSubCategoryId);
    } else if (selectedCategoryId) {
      const subIds = categories
        .filter((c) => c.parentId === selectedCategoryId)
        .map((c) => c.id);
      const allIds = [selectedCategoryId, ...subIds];
      result = result.filter((f) => allIds.includes(f.categoryId));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.items.some((i) => i.toLowerCase().includes(q)) ||
          f.region?.toLowerCase().includes(q) ||
          f.location?.toLowerCase().includes(q) ||
          f.source?.toLowerCase().includes(q),
      );
    }
    return result;
  }, [foods, selectedCategoryId, selectedSubCategoryId, searchQuery, categories]);

  const favorites = useMemo(() => foods.filter((f) => f.isFavorite), [foods]);

  const toggleFavorite = useCallback(async (id: string) => {
    const newVal = await toggleFoodFavorite(id);
    setFoods((prev) =>
      prev.map((f) =>
        f.id === id
          ? { ...f, isFavorite: newVal, updatedAt: new Date().toISOString() }
          : f,
      ),
    );
  }, []);

  const addFood = useCallback(async (data: Omit<FoodItem, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString();
    const food: FoodItem = {
      ...data,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    await insertFood(food);
    setFoods((prev) => [food, ...prev]);
    return food;
  }, []);

  const updateFood = useCallback(async (id: string, updates: Partial<FoodItem>) => {
    await updateFoodItem(id, updates);
    setFoods((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, ...updates, updatedAt: new Date().toISOString() } : f,
      ),
    );
  }, []);

  const deleteFood = useCallback(async (id: string) => {
    await deleteFoodItem(id);
    setFoods((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const getRandomFood = useCallback(() => {
    const pool = selectedCategoryId ? filteredFoods : foods;
    if (pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  }, [foods, filteredFoods, selectedCategoryId]);

  const addCat = useCallback(async (data: Omit<Category, "id">) => {
    const cat: Category = { ...data, id: uuidv4() };
    await insertCategory(cat);
    setCategories((prev) => [...prev, cat]);
    return cat;
  }, []);

  const updateCat = useCallback(async (id: string, updates: Partial<Category>) => {
    await updateCategory(id, updates);
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  }, []);

  const deleteCat = useCallback(async (id: string) => {
    await deleteCategory(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const getCategoryById = useCallback(
    (id: string) => categories.find((c) => c.id === id),
    [categories],
  );

  const doExport = useCallback(async () => {
    return exportAllData();
  }, []);

  const doImport = useCallback(async (jsonStr: string) => {
    const result = await importData(jsonStr);
    await loadData();
    return result;
  }, [loadData]);

  return {
    categories,
    topCategories,
    getSubCategories,
    getCategoryById,
    addCategory: addCat,
    updateCategory: updateCat,
    deleteCategory: deleteCat,
    foods,
    filteredFoods,
    favorites,
    searchQuery,
    setSearchQuery,
    selectedCategoryId,
    setSelectedCategoryId,
    selectedSubCategoryId,
    setSelectedSubCategoryId,
    toggleFavorite,
    addFood,
    updateFood,
    deleteFood,
    getRandomFood,
    exportData: doExport,
    importData: doImport,
    loading,
    reload: loadData,
  };
}
