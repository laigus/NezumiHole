import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, MapPin, ShoppingBag, Star, Pencil, Trash2 } from "lucide-react";
import type { FoodItem, Category } from "@/types";

interface FoodDetailProps {
  food: FoodItem | null;
  category?: Category;
  onClose: () => void;
  onToggleFavorite: (id: string) => void;
  onEdit: (food: FoodItem) => void;
  onDelete: (food: FoodItem) => void;
}

export function FoodDetail({
  food,
  category,
  onClose,
  onToggleFavorite,
  onEdit,
  onDelete,
}: FoodDetailProps) {
  return (
    <AnimatePresence>
      {food && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="modal-content detail-modal"
            initial={{ scale: 0.95, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="modal-close" onClick={onClose}>
              <X size={20} />
            </button>

            <div className="detail-header">
              <h2 className="detail-name">{food.name}</h2>
              <div className="detail-actions">
                <motion.button
                  className="detail-action-btn"
                  whileTap={{ scale: 1.2 }}
                  onClick={() => onToggleFavorite(food.id)}
                >
                  <Heart
                    size={22}
                    fill={food.isFavorite ? "var(--color-favorite)" : "none"}
                    color={food.isFavorite ? "var(--color-favorite)" : "var(--color-text-muted)"}
                  />
                </motion.button>
                <motion.button
                  className="detail-action-btn"
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onEdit(food)}
                >
                  <Pencil size={18} color="var(--color-accent)" />
                </motion.button>
                <motion.button
                  className="detail-action-btn"
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onDelete(food)}
                >
                  <Trash2 size={18} color="var(--color-favorite)" />
                </motion.button>
              </div>
            </div>

            {category && <span className="food-card-badge">{category.name}</span>}

            <div className="detail-meta-grid">
              {food.region && (
                <div className="detail-meta-item">
                  <MapPin size={16} color="var(--color-accent)" />
                  <div>
                    <span className="detail-meta-label">地区</span>
                    <span className="detail-meta-value">{food.region}</span>
                  </div>
                </div>
              )}
              {food.location && (
                <div className="detail-meta-item">
                  <MapPin size={16} color="var(--color-accent)" />
                  <div>
                    <span className="detail-meta-label">位置</span>
                    <span className="detail-meta-value">{food.location}</span>
                  </div>
                </div>
              )}
              {food.source && (
                <div className="detail-meta-item">
                  <ShoppingBag size={16} color="var(--color-accent)" />
                  <div>
                    <span className="detail-meta-label">渠道</span>
                    <span className="detail-meta-value">{food.source}</span>
                  </div>
                </div>
              )}
              {food.rating && (
                <div className="detail-meta-item">
                  <Star size={16} fill="var(--color-accent)" color="var(--color-accent)" />
                  <div>
                    <span className="detail-meta-label">评分</span>
                    <span className="detail-meta-value">{food.rating} / 5</span>
                  </div>
                </div>
              )}
            </div>

            {food.items.length > 0 && (
              <div className="detail-section">
                <h3 className="detail-section-title">推荐菜品 / 商品</h3>
                <div className="detail-items-list">
                  {food.items.map((item, i) => (
                    <span key={i} className="food-card-tag">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {food.notes && (
              <div className="detail-section">
                <h3 className="detail-section-title">备注</h3>
                <p className="detail-notes">{food.notes}</p>
              </div>
            )}

            <div className="detail-footer">
              <span className="detail-date">
                添加于 {new Date(food.createdAt).toLocaleDateString("zh-CN")}
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
