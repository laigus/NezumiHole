import { motion } from "framer-motion";
import { Heart, MapPin, ShoppingBag, Star } from "lucide-react";
import type { FoodItem, Category } from "@/types";

interface FoodCardProps {
  food: FoodItem;
  category?: Category;
  onToggleFavorite: (id: string) => void;
  onClick: (food: FoodItem) => void;
  index: number;
}

export function FoodCard({ food, category, onToggleFavorite, onClick, index }: FoodCardProps) {
  return (
    <motion.div
      className="food-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      layout
      onClick={() => onClick(food)}
    >
      <div className="food-card-header">
        <h3 className="food-card-name">{food.name}</h3>
        <motion.button
          className="food-card-fav"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(food.id);
          }}
          whileTap={{ scale: 1.3 }}
        >
          <Heart
            size={18}
            fill={food.isFavorite ? "var(--color-favorite)" : "none"}
            color={food.isFavorite ? "var(--color-favorite)" : "var(--color-text-muted)"}
          />
        </motion.button>
      </div>

      {category && (
        <span className="food-card-badge">{category.name}</span>
      )}

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
}
