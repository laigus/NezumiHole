import { motion } from "framer-motion";
import { Palette, Sun, Moon, X, FolderTree, Database } from "lucide-react";
import { themes } from "@/themes";
import type { ThemeId, ColorMode } from "@/types";

interface ThemeSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: ThemeId;
  colorMode: ColorMode;
  onSwitchTheme: (id: ThemeId) => void;
  onToggleColorMode: () => void;
  onOpenCategoryManager: () => void;
  onOpenDataManager: () => void;
}

export function ThemeSwitcher({
  isOpen,
  onClose,
  currentTheme,
  colorMode,
  onSwitchTheme,
  onToggleColorMode,
  onOpenCategoryManager,
  onOpenDataManager,
}: ThemeSwitcherProps) {
  if (!isOpen) return null;

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="modal-content settings-modal"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.12 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        <h2 className="settings-title">
          <Palette size={24} /> 设置
        </h2>

        <div className="settings-section">
          <h3 className="settings-subtitle">主题风格</h3>
          <div className="theme-options">
            {themes.map((theme) => (
              <motion.button
                key={theme.id}
                className={`theme-option ${currentTheme === theme.id ? "theme-option-active" : ""}`}
                onClick={() => onSwitchTheme(theme.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="theme-option-name">{theme.name}</span>
                <span className="theme-option-desc">{theme.description}</span>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="settings-section">
          <h3 className="settings-subtitle">颜色模式</h3>
          <motion.button
            className="color-mode-toggle"
            onClick={onToggleColorMode}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {colorMode === "light" ? <Sun size={20} /> : <Moon size={20} />}
            <span>{colorMode === "light" ? "浅色模式" : "深色模式"}</span>
          </motion.button>
        </div>

        <div className="settings-section">
          <h3 className="settings-subtitle">管理</h3>
          <div className="settings-links">
            <motion.button
              className="settings-link-btn"
              onClick={onOpenCategoryManager}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <FolderTree size={18} />
              <span>分类管理</span>
            </motion.button>
            <motion.button
              className="settings-link-btn"
              onClick={onOpenDataManager}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <Database size={18} />
              <span>数据导入 / 导出</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
