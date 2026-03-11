import { motion } from "framer-motion";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <motion.div
      className="search-bar"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Search size={18} className="search-bar-icon" />
      <input
        type="text"
        className="search-bar-input"
        placeholder="搜索店名、菜品、品牌..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <motion.button
          className="search-bar-clear"
          onClick={() => onChange("")}
          whileTap={{ scale: 0.9 }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <X size={16} />
        </motion.button>
      )}
    </motion.div>
  );
}
