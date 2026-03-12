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
  illustration: number;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export const FOOD_ILLUSTRATION_COUNT = 33;
export function getFoodIllustrationPath(index: number): string {
  const i = ((index - 1) % FOOD_ILLUSTRATION_COUNT) + 1;
  return `/food-illustrations/food-${i}.png`;
}
export function randomIllustration(): number {
  return Math.floor(Math.random() * FOOD_ILLUSTRATION_COUNT) + 1;
}

export const CARD_BG_COUNT = 12;
const _sessionSalt = Math.random();
export function getCardBgPath(foodId: string): string {
  let hash = 0;
  const str = foodId + _sessionSalt;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  const idx = (Math.abs(hash) % CARD_BG_COUNT) + 1;
  return `/card-backgrounds/card-${idx}.png`;
}

export type ThemeId = "cute" | "frosted" | "liquid-glass";
export type ColorMode = "light" | "dark";

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  description: string;
}
