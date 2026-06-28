import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Upload, Database, Check, AlertCircle, RefreshCw, Save, Server } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import {
  loadSyncConfig,
  normalizeServerUrl,
  saveSyncConfig,
  syncWithServer,
  type SyncConfig,
} from "@/lib/sync";

interface DataManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: () => Promise<string>;
  onImport: (jsonStr: string) => Promise<{ categories: number; foods: number }>;
}

interface ImportFile {
  path: string;
  data: string;
}

export function DataManager({ isOpen, onClose, onExport, onImport }: DataManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [syncConfig, setSyncConfig] = useState<SyncConfig>(() => loadSyncConfig());
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (isOpen) setSyncConfig(loadSyncConfig());
  }, [isOpen]);

  const handleExport = async () => {
    try {
      const data = await onExport();
      const fileName = `nezumihole-backup-${new Date().toISOString().slice(0, 10)}.json`;

      if ("__TAURI_INTERNALS__" in window) {
        const savedPath = await invoke<string | null>("export_data_to_file", {
          data,
          fileName,
        });

        if (savedPath) {
          setStatus({ type: "success", message: `数据已导出到：${savedPath}` });
        }
        return;
      }

      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      setStatus({ type: "success", message: "数据导出成功！" });
    } catch (err) {
      setStatus({ type: "error", message: `导出失败：${err}` });
    }
  };

  const importText = async (text: string, path?: string) => {
    const result = await onImport(text);
    setStatus({
      type: "success",
      message: `导入成功！${result.categories} 个分类，${result.foods} 条美食记录${path ? `\n${path}` : ""}`,
    });
  };

  const handleImportClick = async () => {
    if (!("__TAURI_INTERNALS__" in window)) {
      fileInputRef.current?.click();
      return;
    }

    try {
      const file = await invoke<ImportFile | null>("import_data_from_file");
      if (!file) return;
      await importText(file.data, file.path);
    } catch (err) {
      setStatus({ type: "error", message: `导入失败：${err}` });
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      await importText(text);
    } catch (err) {
      setStatus({ type: "error", message: `导入失败：${err}` });
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSaveSyncConfig = () => {
    const next = { ...syncConfig, serverUrl: normalizeServerUrl(syncConfig.serverUrl) };
    saveSyncConfig(next);
    setSyncConfig(next);
    setStatus({ type: "success", message: "同步配置已保存到本机" });
  };

  const handleSyncNow = async () => {
    try {
      setSyncing(true);
      const nextConfig = { ...syncConfig, serverUrl: normalizeServerUrl(syncConfig.serverUrl) };
      const localData = JSON.parse(await onExport());
      const result = await syncWithServer(nextConfig, localData);
      await onImport(JSON.stringify(result.snapshot));
      const savedConfig = { ...nextConfig, lastRevision: result.revision };
      saveSyncConfig(savedConfig);
      setSyncConfig(savedConfig);
      setStatus({ type: "success", message: `${result.message}，revision ${result.revision}` });
    } catch (err) {
      setStatus({ type: "error", message: `同步失败：${err}` });
    } finally {
      setSyncing(false);
    }
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
              <Database size={22} /> 数据管理与同步
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
                onClick={handleImportClick}
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

            <div className="settings-section sync-settings">
              <h3 className="settings-subtitle">
                <Server size={18} /> 服务器同步
              </h3>
              <input
                className="form-input"
                type="url"
                value={syncConfig.serverUrl}
                onChange={(e) => setSyncConfig((prev) => ({ ...prev, serverUrl: e.target.value }))}
                placeholder="https://your-sync-server.example.com"
              />
              <input
                className="form-input"
                type="password"
                value={syncConfig.token}
                onChange={(e) => setSyncConfig((prev) => ({ ...prev, token: e.target.value }))}
                placeholder="同步密钥（如服务器启用）"
              />
              <div className="sync-actions">
                <motion.button
                  className="form-btn form-btn-cancel"
                  onClick={handleSaveSyncConfig}
                  whileTap={{ scale: 0.98 }}
                >
                  <Save size={16} /> 保存配置
                </motion.button>
                <motion.button
                  className="form-btn form-btn-submit"
                  onClick={handleSyncNow}
                  disabled={syncing}
                  whileTap={{ scale: 0.98 }}
                >
                  <RefreshCw size={16} /> {syncing ? "同步中..." : "立即同步"}
                </motion.button>
              </div>
            </div>

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
