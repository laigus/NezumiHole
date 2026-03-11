import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Pencil, Trash2, FolderTree } from "lucide-react";
import type { Category } from "@/types";

interface CategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onAdd: (data: Omit<Category, "id">) => Promise<unknown>;
  onUpdate: (id: string, updates: Partial<Category>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function CategoryManager({
  isOpen,
  onClose,
  categories,
  onAdd,
  onUpdate,
  onDelete,
}: CategoryManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editIcon, setEditIcon] = useState("");
  const [addingParentId, setAddingParentId] = useState<string | null | undefined>(undefined);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("map-pin");

  const topCats = categories
    .filter((c) => c.parentId === null)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const getChildren = (parentId: string) =>
    categories
      .filter((c) => c.parentId === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder);

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditIcon(cat.icon);
  };

  const saveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    await onUpdate(editingId, { name: editName.trim(), icon: editIcon.trim() });
    setEditingId(null);
  };

  const startAdd = (parentId: string | null) => {
    setAddingParentId(parentId);
    setNewName("");
    setNewIcon(parentId ? "map-pin" : "package");
  };

  const saveAdd = async () => {
    if (!newName.trim()) return;
    const siblings =
      addingParentId === null
        ? topCats
        : getChildren(addingParentId!);
    const maxOrder = siblings.reduce((m, c) => Math.max(m, c.sortOrder), 0);
    await onAdd({
      name: newName.trim(),
      icon: newIcon.trim(),
      parentId: addingParentId ?? null,
      sortOrder: maxOrder + 1,
    });
    setAddingParentId(undefined);
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
            className="modal-content catmgr-modal"
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
              <FolderTree size={22} /> 分类管理
            </h2>

            <div className="catmgr-list">
              {topCats.map((cat) => (
                <div key={cat.id} className="catmgr-group">
                  <CatRow
                    cat={cat}
                    editing={editingId === cat.id}
                    editName={editName}
                    editIcon={editIcon}
                    onEditName={setEditName}
                    onEditIcon={setEditIcon}
                    onStartEdit={() => startEdit(cat)}
                    onSaveEdit={saveEdit}
                    onCancelEdit={() => setEditingId(null)}
                    onDelete={() => onDelete(cat.id)}
                    level={0}
                  />
                  {getChildren(cat.id).map((sub) => (
                    <CatRow
                      key={sub.id}
                      cat={sub}
                      editing={editingId === sub.id}
                      editName={editName}
                      editIcon={editIcon}
                      onEditName={setEditName}
                      onEditIcon={setEditIcon}
                      onStartEdit={() => startEdit(sub)}
                      onSaveEdit={saveEdit}
                      onCancelEdit={() => setEditingId(null)}
                      onDelete={() => onDelete(sub.id)}
                      level={1}
                    />
                  ))}
                  <motion.button
                    className="catmgr-add-sub"
                    onClick={() => startAdd(cat.id)}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Plus size={14} /> 添加子分类
                  </motion.button>
                </div>
              ))}
            </div>

            <motion.button
              className="catmgr-add-top"
              onClick={() => startAdd(null)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus size={16} /> 添加大分类
            </motion.button>

            {addingParentId !== undefined && (
              <motion.div
                className="catmgr-add-form"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
              >
                <input
                  className="form-input"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="分类名称"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && saveAdd()}
                />
                <input
                  className="form-input"
                  value={newIcon}
                  onChange={(e) => setNewIcon(e.target.value)}
                  placeholder="图标名称"
                />
                <div className="catmgr-add-actions">
                  <motion.button
                    className="form-btn form-btn-cancel"
                    onClick={() => setAddingParentId(undefined)}
                    whileTap={{ scale: 0.97 }}
                  >
                    取消
                  </motion.button>
                  <motion.button
                    className="form-btn form-btn-submit"
                    onClick={saveAdd}
                    whileTap={{ scale: 0.97 }}
                  >
                    添加
                  </motion.button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CatRow({
  cat,
  editing,
  editName,
  editIcon,
  onEditName,
  onEditIcon,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  level,
}: {
  cat: Category;
  editing: boolean;
  editName: string;
  editIcon: string;
  onEditName: (v: string) => void;
  onEditIcon: (v: string) => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  level: number;
}) {
  if (editing) {
    return (
      <div className="catmgr-row catmgr-row-editing" style={{ paddingLeft: level * 24 + 12 }}>
        <input
          className="form-input catmgr-edit-input"
          value={editName}
          onChange={(e) => onEditName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSaveEdit()}
          autoFocus
        />
        <input
          className="form-input catmgr-edit-input catmgr-edit-icon"
          value={editIcon}
          onChange={(e) => onEditIcon(e.target.value)}
          placeholder="icon"
        />
        <motion.button className="catmgr-btn" onClick={onSaveEdit} whileTap={{ scale: 0.9 }}>
          保存
        </motion.button>
        <motion.button className="catmgr-btn" onClick={onCancelEdit} whileTap={{ scale: 0.9 }}>
          取消
        </motion.button>
      </div>
    );
  }

  return (
    <div className="catmgr-row" style={{ paddingLeft: level * 24 + 12 }}>
      <span className="catmgr-name">
        {level > 0 && "└ "}
        {cat.name}
      </span>
      <div className="catmgr-row-actions">
        <motion.button className="catmgr-btn" onClick={onStartEdit} whileTap={{ scale: 0.9 }}>
          <Pencil size={14} />
        </motion.button>
        <motion.button className="catmgr-btn catmgr-btn-danger" onClick={onDelete} whileTap={{ scale: 0.9 }}>
          <Trash2 size={14} />
        </motion.button>
      </div>
    </div>
  );
}
