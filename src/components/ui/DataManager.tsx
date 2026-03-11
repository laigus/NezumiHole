import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Upload, Database, Check, AlertCircle } from "lucide-react";

interface DataManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: () => Promise<string>;
  onImport: (jsonStr: string) => Promise<{ categories: number; foods: number }>;
}

export function DataManager({ isOpen, onClose, onExport, onImport }: DataManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleExport = async () => {
    try {
      const data = await onExport();
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nezumihole-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus({ type: "success", message: "数据导出成功！" });
    } catch (err) {
      setStatus({ type: "error", message: `导出失败：${err}` });
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const result = await onImport(text);
      setStatus({
        type: "success",
        message: `导入成功！${result.categories} 个分类，${result.foods} 条美食记录`,
      });
    } catch (err) {
      setStatus({ type: "error", message: `导入失败：${err}` });
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
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
            className="modal-content data-modal"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.12 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="modal-close" onClick={onClose}>
              <X size={20} />
            </button>

            <h2 className="settings-title">
              <Database size={22} /> 数据管理
            </h2>

            <div className="data-actions">
              <motion.button
                className="data-action-card"
                onClick={handleExport}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Download size={32} color="var(--color-accent)" />
                <h3>导出数据</h3>
                <p>将所有数据导出为 JSON 文件备份</p>
              </motion.button>

              <motion.button
                className="data-action-card"
                onClick={() => fileInputRef.current?.click()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Upload size={32} color="var(--color-accent)" />
                <h3>导入数据</h3>
                <p>从 JSON 备份文件恢复数据（会覆盖现有数据）</p>
              </motion.button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              style={{ display: "none" }}
            />

            <AnimatePresence>
              {status && (
                <motion.div
                  className={`data-status ${status.type === "success" ? "data-status-success" : "data-status-error"}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  {status.type === "success" ? (
                    <Check size={18} />
                  ) : (
                    <AlertCircle size={18} />
                  )}
                  {status.message}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
