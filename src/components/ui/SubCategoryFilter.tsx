import { motion } from "framer-motion";
import type { Category } from "@/types";

interface SubCategoryFilterProps {
  subCategories: Category[];
  selectedSubId: string | null;
  onSelect: (id: string | null) => void;
}

export function SubCategoryFilter({
  subCategories,
  selectedSubId,
  onSelect,
}: SubCategoryFilterProps) {
  if (subCategories.length === 0) return null;

  return (
    <motion.div
      className="sub-filter-bar"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.button
        className={`sub-filter-chip ${selectedSubId === null ? "sub-filter-chip-active" : ""}`}
        onClick={() => onSelect(null)}
        whileTap={{ scale: 0.95 }}
      >
        全部
      </motion.button>
      {subCategories.map((sub) => (
        <motion.button
          key={sub.id}
          className={`sub-filter-chip ${selectedSubId === sub.id ? "sub-filter-chip-active" : ""}`}
          onClick={() => onSelect(sub.id === selectedSubId ? null : sub.id)}
          whileTap={{ scale: 0.95 }}
          layout
        >
          {sub.name}
        </motion.button>
      ))}
    </motion.div>
  );
}
