import type { ThemeConfig, ThemeId, ColorMode } from "@/types";

export const themes: ThemeConfig[] = [
  {
    id: "cute",
    name: "可爱插画风",
    description: "柔和色彩、圆角卡片、手绘风装饰",
  },
  {
    id: "frosted",
    name: "磨砂玻璃",
    description: "柔光磨砂、半透明面板、朦胧质感",
  },
  {
    id: "liquid-glass",
    name: "液态玻璃",
    description: "晶莹剔透、光影折射、立体通透",
  },
];

export function applyTheme(themeId: ThemeId, colorMode: ColorMode) {
  const root = document.documentElement;
  root.setAttribute("data-theme", themeId);
  root.setAttribute("data-color-mode", colorMode);
}

export function getStoredTheme(): { themeId: ThemeId; colorMode: ColorMode } {
  let themeId = (localStorage.getItem("theme") as ThemeId) || "cute";
  if (themeId === ("glass" as string)) themeId = "frosted";
  const colorMode = (localStorage.getItem("colorMode") as ColorMode) || "light";
  return { themeId, colorMode };
}

export function storeTheme(themeId: ThemeId, colorMode: ColorMode) {
  localStorage.setItem("theme", themeId);
  localStorage.setItem("colorMode", colorMode);
}
