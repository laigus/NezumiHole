import { useState, useEffect, useCallback } from "react";
import type { ThemeId, ColorMode } from "@/types";
import { applyTheme, getStoredTheme, storeTheme } from "@/themes";

export function useTheme() {
  const [themeId, setThemeId] = useState<ThemeId>("cute");
  const [colorMode, setColorMode] = useState<ColorMode>("light");

  useEffect(() => {
    const stored = getStoredTheme();
    setThemeId(stored.themeId);
    setColorMode(stored.colorMode);
    applyTheme(stored.themeId, stored.colorMode);
  }, []);

  const switchTheme = useCallback(
    (newTheme: ThemeId) => {
      setThemeId(newTheme);
      applyTheme(newTheme, colorMode);
      storeTheme(newTheme, colorMode);
    },
    [colorMode],
  );

  const toggleColorMode = useCallback(() => {
    const newMode = colorMode === "light" ? "dark" : "light";
    setColorMode(newMode);
    applyTheme(themeId, newMode);
    storeTheme(themeId, newMode);
  }, [themeId, colorMode]);

  return { themeId, colorMode, switchTheme, toggleColorMode };
}
