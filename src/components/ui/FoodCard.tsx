import { memo } from "react";
import { motion } from "framer-motion";
import { MapPin, ShoppingBag, Star } from "lucide-react";
import type { FoodItem, Category } from "@/types";
import { getFoodIllustrationPath, getCardBgPath } from "@/types";

function CuteHeart({ size = 18, filled = false, color = "currentColor" }: { size?: number; filled?: boolean; color?: string }) {
  return (
    <svg width={size} height={size * 0.8} viewBox="0 0 24 20" fill={filled ? color : "none"} stroke={color} strokeWidth={filled ? 0 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 18.5C12 18.5 1 12 1 7C1 3.5 3.8 1.2 7.2 1.2C9.5 1.2 11.1 2.5 12 4.5C12.9 2.5 14.5 1.2 16.8 1.2C20.2 1.2 23 3.5 23 7C23 12 12 18.5 12 18.5Z" />
    </svg>
  );
}

interface FoodCardProps {
  food: FoodItem;
  category?: Category;
  onToggleFavorite: (id: string) => void;
  onClick: (food: FoodItem) => void;
  index: number;
}

const MAX_STAGGER_INDEX = 15;

export const FoodCard = memo(function FoodCard({ food, category, onToggleFavorite, onClick, index }: FoodCardProps) {
  return (
    <motion.div
      className="food-card"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{
        delay: index < MAX_STAGGER_INDEX ? index * 0.03 : 0,
        duration: 0.3,
      }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      layout
      onClick={() => onClick(food)}
    >
      <img
        src={getCardBgPath(food.id)}
        alt=""
        className="food-card-bg"
        loading="lazy"
        draggable={false}
      />
      <div className="food-card-header">
        <div className="food-card-header-left">
          <h3 className="food-card-name">{food.name}</h3>
          {category && (
            <span className="food-card-badge">{category.name}</span>
          )}
        </div>
        <motion.button
          className="food-card-fav"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(food.id);
          }}
          whileTap={{ scale: 1.3 }}
        >
          <CuteHeart
            size={20}
            filled={food.isFavorite}
            color={food.isFavorite ? "var(--color-favorite)" : "var(--color-text-muted)"}
          />
        </motion.button>
      </div>

      <div className="food-card-illustration">
        <img
          src={getFoodIllustrationPath(food.illustration)}
          alt=""
          className="food-card-illustration-img"
          loading="lazy"
        />
      </div>

      {food.items.length > 0 && (
        <div className="food-card-items">
          {food.items.slice(0, 4).map((item, i) => (
            <span key={i} className="food-card-tag">
              {item}
            </span>
          ))}
          {food.items.length > 4 && (
            <span className="food-card-tag food-card-tag-more">
              +{food.items.length - 4}
            </span>
          )}
        </div>
      )}

      <div className="food-card-meta">
        {food.region && (
          <span className="food-card-meta-item">
            <MapPin size={12} />
            {food.region}
          </span>
        )}
        {food.source && (
          <span className="food-card-meta-item">
            <ShoppingBag size={12} />
            {food.source}
          </span>
        )}
        {food.rating && (
          <span className="food-card-meta-item">
            <Star size={12} fill="var(--color-accent)" color="var(--color-accent)" />
            {food.rating}
          </span>
        )}
      </div>
    </motion.div>
  );
});
