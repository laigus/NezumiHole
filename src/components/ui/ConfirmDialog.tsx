import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = "确认",
  cancelText = "取消",
  onConfirm,
  onCancel,
  danger = false,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          style={{ zIndex: 200 }}
        >
          <motion.div
            className="modal-content confirm-modal"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.12 }}
            onClick={(e) => e.stopPropagation()}
          >
            {danger && (
              <div className="confirm-icon">
                <AlertTriangle size={40} color="var(--color-favorite)" />
              </div>
            )}
            <h3 className="confirm-title">{title}</h3>
            <p className="confirm-message">{message}</p>
            <div className="confirm-actions">
              <motion.button
                className="form-btn form-btn-cancel"
                onClick={onCancel}
                whileTap={{ scale: 0.97 }}
              >
                {cancelText}
              </motion.button>
              <motion.button
                className={`form-btn ${danger ? "form-btn-danger" : "form-btn-submit"}`}
                onClick={onConfirm}
                whileTap={{ scale: 0.97 }}
              >
                {confirmText}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
