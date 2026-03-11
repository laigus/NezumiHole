import { motion } from "framer-motion";
import {
  Dog,
  UtensilsCrossed,
  Candy,
  CupSoda,
  Sparkles,
  Heart,
  Dices,
  Settings,
  Home,
} from "lucide-react";
import type { Category } from "@/types";

const iconMap: Record<string, React.ComponentType<{ size?: number }>> = {
  dog: Dog,
  "utensils-crossed": UtensilsCrossed,
  candy: Candy,
  "cup-soda": CupSoda,
  sparkles: Sparkles,
};

interface SidebarProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
  onShowFavorites: () => void;
  onShowRandom: () => void;
  onShowSettings: () => void;
  showFavorites: boolean;
}

export function Sidebar({
  categories,
  selectedCategoryId,
  onSelectCategory,
  onShowFavorites,
  onShowRandom,
  onShowSettings,
  showFavorites,
}: SidebarProps) {
  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="sidebar"
    >
      <div className="sidebar-header">
        <motion.h1
          className="sidebar-title"
          whileHover={{ scale: 1.02 }}
        >
          🐭 耗耗洞
        </motion.h1>
      </div>

      <nav className="sidebar-nav">
        <SidebarItem
          icon={<Home size={20} />}
          label="全部"
          active={!selectedCategoryId && !showFavorites}
          onClick={() => onSelectCategory(null)}
        />

        <div className="sidebar-divider" />

        {categories.map((cat) => {
          const Icon = iconMap[cat.icon];
          return (
            <SidebarItem
              key={cat.id}
              icon={Icon ? <Icon size={20} /> : <span>{cat.icon}</span>}
              label={cat.name}
              active={selectedCategoryId === cat.id}
              onClick={() => onSelectCategory(cat.id)}
            />
          );
        })}

        <div className="sidebar-divider" />

        <SidebarItem
          icon={<Heart size={20} />}
          label="我的收藏"
          active={showFavorites}
          onClick={onShowFavorites}
        />
        <SidebarItem
          icon={<Dices size={20} />}
          label="随机推荐"
          active={false}
          onClick={onShowRandom}
        />

        <div className="sidebar-spacer" />

        <SidebarItem
          icon={<Settings size={20} />}
          label="设置"
          active={false}
          onClick={onShowSettings}
        />
      </nav>
    </motion.aside>
  );
}

function SidebarItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      className={`sidebar-item ${active ? "sidebar-item-active" : ""}`}
      onClick={onClick}
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.97 }}
    >
      <span className="sidebar-item-icon">{icon}</span>
      <span className="sidebar-item-label">{label}</span>
    </motion.button>
  );
}
