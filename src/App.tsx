import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { FoodCard } from "@/components/ui/FoodCard";
import { SearchBar } from "@/components/ui/SearchBar";
import { SubCategoryFilter } from "@/components/ui/SubCategoryFilter";
import { RandomWheel } from "@/components/ui/RandomWheel";
import { ThemeSwitcher } from "@/components/ui/ThemeSwitcher";
import { FoodDetail } from "@/components/ui/FoodDetail";
import { FoodForm } from "@/components/ui/FoodForm";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CategoryManager } from "@/components/ui/CategoryManager";
import { DataManager } from "@/components/ui/DataManager";
import { useAppStore } from "@/store";
import { useTheme } from "@/hooks/useTheme";
import { useSound } from "@/hooks/useSound";
import type { FoodItem } from "@/types";

export default function App() {
  const store = useAppStore();
  const theme = useTheme();
  const sound = useSound();

  const [showFavorites, setShowFavorites] = useState(false);
  const [showRandom, setShowRandom] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showDataManager, setShowDataManager] = useState(false);

  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [showFoodForm, setShowFoodForm] = useState(false);
  const [editingFood, setEditingFood] = useState<FoodItem | null>(null);
  const [deletingFood, setDeletingFood] = useState<FoodItem | null>(null);

  const handleSelectCategory = useCallback(
    (id: string | null) => {
      sound.play("click");
      store.setSelectedCategoryId(id);
      store.setSelectedSubCategoryId(null);
      setShowFavorites(false);
    },
    [store, sound],
  );

  const handleShowFavorites = useCallback(() => {
    sound.play("click");
    setShowFavorites(true);
    store.setSelectedCategoryId(null);
  }, [store, sound]);

  const handleToggleFavorite = useCallback(
    async (id: string) => {
      const food = store.foods.find((f) => f.id === id);
      sound.play(food?.isFavorite ? "unfavorite" : "favorite");
      await store.toggleFavorite(id);
    },
    [store, sound],
  );

  const handleEdit = useCallback((food: FoodItem) => {
    setSelectedFood(null);
    setEditingFood(food);
    setShowFoodForm(true);
  }, []);

  const handleDelete = useCallback((food: FoodItem) => {
    setSelectedFood(null);
    setDeletingFood(food);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (deletingFood) {
      sound.play("delete");
      await store.deleteFood(deletingFood.id);
      setDeletingFood(null);
    }
  }, [deletingFood, store, sound]);

  const handleFormSubmit = useCallback(
    async (data: Omit<FoodItem, "id" | "createdAt" | "updatedAt">) => {
      sound.play("add");
      if (editingFood) {
        await store.updateFood(editingFood.id, data);
      } else {
        await store.addFood(data);
      }
      setEditingFood(null);
      setShowFoodForm(false);
    },
    [editingFood, store, sound],
  );

  const handleAddNew = useCallback(() => {
    sound.play("click");
    setEditingFood(null);
    setShowFoodForm(true);
  }, [sound]);

  const handleThemeSwitch = useCallback(
    (id: Parameters<typeof theme.switchTheme>[0]) => {
      sound.play("themeSwitch");
      theme.switchTheme(id);
    },
    [theme, sound],
  );

  const handleColorModeToggle = useCallback(() => {
    sound.play("themeSwitch");
    theme.toggleColorMode();
  }, [theme, sound]);

  const displayedFoods = showFavorites ? store.favorites : store.filteredFoods;
  const currentSubCategories = store.selectedCategoryId
    ? store.getSubCategories(store.selectedCategoryId)
    : [];

  const currentCategoryName = showFavorites
    ? "我的收藏"
    : store.selectedCategoryId
      ? store.getCategoryById(store.selectedCategoryId)?.name ?? "全部"
      : "全部美食";

  if (store.loading) {
    return (
      <div className="loading-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="loading-icon"
        >
          🐭
        </motion.div>
        <p>正在加载耗耗洞...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Sidebar
        categories={store.topCategories}
        selectedCategoryId={store.selectedCategoryId}
        onSelectCategory={handleSelectCategory}
        onShowFavorites={handleShowFavorites}
        onShowRandom={() => { sound.play("click"); setShowRandom(true); }}
        onShowSettings={() => { sound.play("click"); setShowSettings(true); }}
        showFavorites={showFavorites}
      />

      <main className="main-content">
        <div className="main-header">
          <div className="main-header-left">
            <motion.h2
              className="main-title"
              key={currentCategoryName}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              {currentCategoryName}
            </motion.h2>
            <span className="main-count">{displayedFoods.length} 条记录</span>
          </div>
          <motion.button
            className="add-food-btn"
            onClick={handleAddNew}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus size={18} />
            添加美食
          </motion.button>
        </div>

        <SearchBar value={store.searchQuery} onChange={store.setSearchQuery} />

        <SubCategoryFilter
          subCategories={currentSubCategories}
          selectedSubId={store.selectedSubCategoryId}
          onSelect={(id) => { sound.play("click"); store.setSelectedSubCategoryId(id); }}
        />

        <motion.div className="food-grid" layout>
          <AnimatePresence mode="popLayout">
            {displayedFoods.map((food, index) => (
              <FoodCard
                key={food.id}
                food={food}
                category={store.getCategoryById(food.categoryId)}
                onToggleFavorite={handleToggleFavorite}
                onClick={(f) => { sound.play("click"); setSelectedFood(f); }}
                index={index}
              />
            ))}
          </AnimatePresence>

          {displayedFoods.length === 0 && (
            <motion.div
              className="empty-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <span className="empty-icon">🔍</span>
              <p className="empty-text">
                {store.searchQuery ? "没有找到匹配的美食" : "这个分类还没有记录"}
              </p>
            </motion.div>
          )}
        </motion.div>
      </main>

      <FoodDetail
        food={selectedFood}
        category={selectedFood ? store.getCategoryById(selectedFood.categoryId) : undefined}
        onClose={() => setSelectedFood(null)}
        onToggleFavorite={async (id) => {
          await handleToggleFavorite(id);
          setSelectedFood((prev) => (prev ? { ...prev, isFavorite: !prev.isFavorite } : null));
        }}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <FoodForm
        isOpen={showFoodForm}
        onClose={() => { setShowFoodForm(false); setEditingFood(null); }}
        onSubmit={handleFormSubmit}
        categories={store.categories}
        editingFood={editingFood}
      />

      <ConfirmDialog
        isOpen={!!deletingFood}
        title="确认删除"
        message={`确定要删除「${deletingFood?.name}」吗？此操作不可撤销。`}
        confirmText="删除"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingFood(null)}
        danger
      />

      <RandomWheel
        isOpen={showRandom}
        onClose={() => setShowRandom(false)}
        onSpin={store.getRandomFood}
        onSpinStart={() => sound.play("spin")}
        onResult={() => sound.play("result")}
      />

      <ThemeSwitcher
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        currentTheme={theme.themeId}
        colorMode={theme.colorMode}
        onSwitchTheme={handleThemeSwitch}
        onToggleColorMode={handleColorModeToggle}
        onOpenCategoryManager={() => { setShowSettings(false); setShowCategoryManager(true); }}
        onOpenDataManager={() => { setShowSettings(false); setShowDataManager(true); }}
      />

      <CategoryManager
        isOpen={showCategoryManager}
        onClose={() => setShowCategoryManager(false)}
        categories={store.categories}
        onAdd={store.addCategory}
        onUpdate={store.updateCategory}
        onDelete={store.deleteCategory}
      />

      <DataManager
        isOpen={showDataManager}
        onClose={() => setShowDataManager(false)}
        onExport={store.exportData}
        onImport={store.importData}
      />
    </div>
  );
}
