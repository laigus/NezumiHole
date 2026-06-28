import type { ComponentType, ReactNode } from "react";
import {
  Apple,
  Beef,
  BookOpen,
  CakeSlice,
  Candy,
  Coffee,
  Cookie,
  CupSoda,
  Dog,
  Fish,
  IceCreamBowl,
  MapPin,
  Package,
  Pizza,
  Salad,
  Soup,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";

export interface CategoryIconOption {
  id: string;
  label: string;
  Icon: ComponentType<{ size?: number }>;
}

export const categoryIconOptions: CategoryIconOption[] = [
  { id: "book-open", label: "食谱", Icon: BookOpen },
  { id: "utensils-crossed", label: "餐食", Icon: UtensilsCrossed },
  { id: "soup", label: "热汤", Icon: Soup },
  { id: "salad", label: "轻食", Icon: Salad },
  { id: "beef", label: "肉类", Icon: Beef },
  { id: "fish", label: "鱼鲜", Icon: Fish },
  { id: "pizza", label: "披萨", Icon: Pizza },
  { id: "cake-slice", label: "甜点", Icon: CakeSlice },
  { id: "candy", label: "零食", Icon: Candy },
  { id: "cookie", label: "饼干", Icon: Cookie },
  { id: "cup-soda", label: "饮品", Icon: CupSoda },
  { id: "coffee", label: "咖啡", Icon: Coffee },
  { id: "ice-cream-bowl", label: "冰品", Icon: IceCreamBowl },
  { id: "apple", label: "水果", Icon: Apple },
  { id: "dog", label: "狗粮", Icon: Dog },
  { id: "sparkles", label: "想尝试", Icon: Sparkles },
  { id: "map-pin", label: "地点", Icon: MapPin },
  { id: "package", label: "通用", Icon: Package },
];

const iconAliases: Record<string, string> = {
  NezumiRecipes: "book-open",
  nezumiRecipes: "book-open",
  recipes: "book-open",
};

const iconMap = new Map(categoryIconOptions.map((option) => [option.id, option.Icon]));

export function normalizeCategoryIcon(icon: string) {
  return iconAliases[icon] || icon;
}

export function renderCategoryIcon(icon: string, size = 20): ReactNode {
  const normalized = normalizeCategoryIcon(icon);
  const Icon = iconMap.get(normalized);
  if (Icon) return <Icon size={size} />;
  if (normalized.length <= 3) return <span>{normalized}</span>;
  return <Package size={size} />;
}
