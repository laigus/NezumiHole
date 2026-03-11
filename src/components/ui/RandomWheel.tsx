import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dices, X } from "lucide-react";
import type { FoodItem } from "@/types";

interface RandomWheelProps {
  isOpen: boolean;
  onClose: () => void;
  onSpin: () => FoodItem | null;
  onSpinStart?: () => void;
  onResult?: () => void;
}

export function RandomWheel({ isOpen, onClose, onSpin, onSpinStart, onResult }: RandomWheelProps) {
  const [result, setResult] = useState<FoodItem | null>(null);
  const [spinning, setSpinning] = useState(false);

  const handleSpin = () => {
    setSpinning(true);
    setResult(null);
    onSpinStart?.();

    setTimeout(() => {
      const food = onSpin();
      setResult(food);
      setSpinning(false);
      if (food) onResult?.();
    }, 1500);
  };

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
            className="modal-content random-modal"
            initial={{ scale: 0.95, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="modal-close" onClick={onClose}>
              <X size={20} />
            </button>

            <h2 className="random-title">今天吃什么？</h2>

            <motion.div
              className="random-dice-container"
              animate={spinning ? { rotate: 360 } : {}}
              transition={spinning ? { duration: 0.5, repeat: Infinity, ease: "linear" } : {}}
            >
              <Dices size={80} color="var(--color-accent)" />
            </motion.div>

            <AnimatePresence mode="wait">
              {result && !spinning && (
                <motion.div
                  className="random-result"
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <h3 className="random-result-name">{result.name}</h3>
                  {result.items.length > 0 && (
                    <p className="random-result-items">
                      推荐：{result.items.slice(0, 3).join("、")}
                    </p>
                  )}
                  {result.region && (
                    <p className="random-result-region">📍 {result.region}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              className="random-spin-btn"
              onClick={handleSpin}
              disabled={spinning}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {spinning ? "摇一摇中..." : result ? "再来一次" : "开始摇一摇！"}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
