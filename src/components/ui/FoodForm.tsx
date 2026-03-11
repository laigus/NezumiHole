import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus } from "lucide-react";
import type { FoodItem, Category } from "@/types";
import { FOOD_ILLUSTRATION_COUNT, getFoodIllustrationPath, randomIllustration } from "@/types";

interface FoodFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<FoodItem, "id" | "createdAt" | "updatedAt">) => void;
  categories: Category[];
  editingFood?: FoodItem | null;
}

export function FoodForm({
  isOpen,
  onClose,
  onSubmit,
  categories,
  editingFood,
}: FoodFormProps) {
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [region, setRegion] = useState("");
  const [location, setLocation] = useState("");
  const [source, setSource] = useState("");
  const [items, setItems] = useState<string[]>([""]);
  const [rating, setRating] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [illustration, setIllustration] = useState(1);

  useEffect(() => {
    if (editingFood) {
      setName(editingFood.name);
      setCategoryId(editingFood.categoryId);
      setRegion(editingFood.region || "");
      setLocation(editingFood.location || "");
      setSource(editingFood.source || "");
      setItems(editingFood.items.length > 0 ? editingFood.items : [""]);
      setRating(editingFood.rating?.toString() || "");
      setNotes(editingFood.notes || "");
      setIllustration(editingFood.illustration || 1);
    } else {
      resetForm();
    }
  }, [editingFood, isOpen]);

  const resetForm = () => {
    setName("");
    setCategoryId("");
    setRegion("");
    setLocation("");
    setSource("");
    setItems([""]);
    setRating("");
    setNotes("");
    setIllustration(randomIllustration());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !categoryId) return;

    onSubmit({
      name: name.trim(),
      categoryId,
      region: region.trim() || null,
      location: location.trim() || null,
      source: source.trim() || null,
      items: items.filter((i) => i.trim() !== ""),
      rating: rating ? parseFloat(rating) : null,
      notes: notes.trim() || null,
      images: editingFood?.images || [],
      illustration,
      isFavorite: editingFood?.isFavorite || false,
    });
    onClose();
  };

  const addItem = () => setItems([...items, ""]);
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx: number, val: string) =>
    setItems(items.map((item, i) => (i === idx ? val : item)));

  const allCategories = categories.sort((a, b) => {
    if (a.parentId === null && b.parentId !== null) return -1;
    if (a.parentId !== null && b.parentId === null) return 1;
    return a.sortOrder - b.sortOrder;
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="modal-content form-modal"
            initial={{ scale: 0.95, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="modal-close" onClick={onClose}>
              <X size={20} />
            </button>

            <h2 className="form-title">
              {editingFood ? "编辑美食" : "添加美食"}
            </h2>

            <form onSubmit={handleSubmit} className="form-body">
              <div className="form-group">
                <label className="form-label">名称 *</label>
                <input
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="店名或品牌名"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">分类 *</label>
                <select
                  className="form-input form-select"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                >
                  <option value="">选择分类</option>
                  {allCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.parentId ? "　└ " : ""}{cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group form-group-half">
                  <label className="form-label">地区</label>
                  <input
                    className="form-input"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder="如：上海-临港"
                  />
                </div>
                <div className="form-group form-group-half">
                  <label className="form-label">位置</label>
                  <input
                    className="form-input"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="如：美罗城"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group form-group-half">
                  <label className="form-label">购买渠道</label>
                  <input
                    className="form-input"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    placeholder="如：抖音、淘宝、线下"
                  />
                </div>
                <div className="form-group form-group-half">
                  <label className="form-label">评分 (1-5)</label>
                  <input
                    className="form-input"
                    type="number"
                    min="1"
                    max="5"
                    step="0.5"
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    placeholder="可选"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  推荐菜品 / 商品
                  <motion.button
                    type="button"
                    className="form-add-btn"
                    onClick={addItem}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Plus size={14} /> 添加
                  </motion.button>
                </label>
                {items.map((item, idx) => (
                  <div key={idx} className="form-item-row">
                    <input
                      className="form-input"
                      value={item}
                      onChange={(e) => updateItem(idx, e.target.value)}
                      placeholder={`菜品/商品 ${idx + 1}`}
                    />
                    {items.length > 1 && (
                      <motion.button
                        type="button"
                        className="form-remove-btn"
                        onClick={() => removeItem(idx)}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Minus size={14} />
                      </motion.button>
                    )}
                  </div>
                ))}
              </div>

              <div className="form-group">
                <label className="form-label">食物插画</label>
                <div className="form-illustration-picker">
                  {Array.from({ length: FOOD_ILLUSTRATION_COUNT }, (_, i) => i + 1).map((idx) => (
                    <motion.button
                      key={idx}
                      type="button"
                      className={`form-illustration-option ${illustration === idx ? "form-illustration-active" : ""}`}
                      onClick={() => setIllustration(idx)}
                      whileTap={{ scale: 0.95 }}
                    >
                      <img src={getFoodIllustrationPath(idx)} alt={`插画 ${idx}`} />
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">备注</label>
                <textarea
                  className="form-input form-textarea"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="可选备注..."
                  rows={3}
                />
              </div>

              <div className="form-actions">
                <motion.button
                  type="button"
                  className="form-btn form-btn-cancel"
                  onClick={onClose}
                  whileTap={{ scale: 0.97 }}
                >
                  取消
                </motion.button>
                <motion.button
                  type="submit"
                  className="form-btn form-btn-submit"
                  whileTap={{ scale: 0.97 }}
                >
                  {editingFood ? "保存修改" : "添加"}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
