export interface Category {
  id: string;
  name: string;
  icon: string;
  parentId: string | null;
  sortOrder: number;
}

export interface FoodItem {
  id: string;
  name: string;
  categoryId: string;
  region: string | null;
  location: string | null;
  source: string | null;
  items: string[];
  rating: number | null;
  notes: string | null;
  images: string[];
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ThemeId = "cute" | "frosted" | "liquid-glass";
export type ColorMode = "light" | "dark";

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  description: string;
}
