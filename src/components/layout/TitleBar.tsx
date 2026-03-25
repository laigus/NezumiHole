import { useState, useEffect, useCallback } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

const appWindow = getCurrentWindow();

export function TitleBar() {
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    const unlisten = appWindow.onResized(async () => {
      setMaximized(await appWindow.isMaximized());
    });
    appWindow.isMaximized().then(setMaximized);
    return () => { unlisten.then((fn) => fn()); };
  }, []);

  const handleDrag = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".titlebar-btn")) return;
    e.preventDefault();
    appWindow.startDragging();
  }, []);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".titlebar-btn")) return;
    appWindow.toggleMaximize();
  }, []);

  return (
    <>
      {/* Invisible drag region covering the full top edge */}
      <div
        className="titlebar-drag-region"
        onMouseDown={handleDrag}
        onDoubleClick={handleDoubleClick}
      />
      {/* Window control buttons pinned to top-right corner */}
      <div className="titlebar-controls">
        <button
          className="titlebar-btn titlebar-btn-minimize"
          onClick={() => appWindow.minimize()}
          aria-label="最小化"
        >
          <svg width="10" height="1" viewBox="0 0 10 1">
            <rect width="10" height="1" fill="currentColor" />
          </svg>
        </button>
        <button
          className="titlebar-btn titlebar-btn-maximize"
          onClick={() => appWindow.toggleMaximize()}
          aria-label={maximized ? "还原" : "最大化"}
        >
          {maximized ? (
            <svg width="10" height="10" viewBox="0 0 10 10">
              <path
                d="M2 0h6v2H10v6H8v2H0V4h2V0zm1 1v2h5v5h1V2H3zm-2 3v5h6V4H1z"
                fill="currentColor"
              />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 10 10">
              <rect
                x="0.5" y="0.5" width="9" height="9"
                fill="none" stroke="currentColor" strokeWidth="1"
              />
            </svg>
          )}
        </button>
        <button
          className="titlebar-btn titlebar-btn-close"
          onClick={() => appWindow.close()}
          aria-label="关闭"
        >
          <svg width="10" height="10" viewBox="0 0 10 10">
            <path
              d="M1 0L5 4L9 0L10 1L6 5L10 9L9 10L5 6L1 10L0 9L4 5L0 1Z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>
    </>
  );
}
