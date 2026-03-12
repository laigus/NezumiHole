---
description: NezumiHole 项目的设计、架构、实现细节和开发进度。AI 在丢失上下文时应优先阅读此文档。
globs:
  - "**/*"
---

# 耗耗洞 NezumiHole — 项目文档

> 像小老鼠一样，把所有好吃好喝的都囤进洞里。

个人美食收藏桌面应用。记录买过的好吃好喝的东西，按分类/地区/渠道整理，方便以后想吃时快速找到。

## 技术架构

| 层 | 技术 | 说明 |
|----|------|------|
| 桌面壳 | Tauri 2 (Rust) | 轻量桌面容器，NSIS ~3MB |
| 前端 | React 19 + TypeScript | SPA 单页应用 |
| 构建 | Vite 7 + pnpm | 快速构建与 HMR |
| 样式 | CSS Variables 主题系统 | 三套主题 + 深色模式 |
| 动效 | Framer Motion | 卡片入场、悬浮、页面切换 |
| 音效 | Web Audio API | 合成音效（点击/收藏/推荐/切换/删除/添加） |
| 字体 | LXGW WenKai (CDN) | 中文手写风，系统字体降级 |
| 数据库 | SQLite via tauri-plugin-sql | 桌面端持久化，浏览器端降级为内存 |
| 图标 | Lucide React | 卡片内可爱手绘爱心为自定义 SVG |

## 主题系统

三套主题，均含深色模式变体。通过 `data-theme` 和 `data-color-mode` 属性切换。

### 可爱插画风 (cute) — 当前主打主题

- **色调**：暖杏桃色调（非纯粉色），参考 `素材/ChatGPT Image 2026年3月11日 22_24_23.png`
- **CSS 变量定义**：`src/themes/theme.css`
- **主题特定样式**：`src/styles.css` 中 `[data-theme="cute"]` 选择器
- 卡片无 CSS 边框/背景，由 **卡片背景图** (`public/card-backgrounds/card-{1-12}.png`) 直接作为卡片视觉本体
- 背景图通过 `getCardBgPath(foodId)` 基于食物 ID + 会话盐哈希分配（同一次启动内稳定，跨重启随机）
- 卡片内容有 `padding: 28px 24px 22px` 以避开背景图内部虚线边框
- 爱心图标为自定义宽扁 SVG (`CuteHeart` in `FoodCard.tsx`)
- 侧边栏"凸出标签"效果、装饰元素

### 磨砂玻璃 (frosted)

- 磨砂玻璃背景 (`backdrop-filter: blur`)、半透明面板

### 晶莹剔透 (liquid-glass)

- 3D 厚玻璃风格：5 层 CSS 叠加（厚度渐变 + specular highlight + 棱镜色散边框 + 多层阴影 + 方向性边框）
- **痛点**：纯 CSS 实现的"晶莹感"不足，可能需要 SVG filter / WebGL shader / 玻璃纹理贴图突破

## 食物插画系统

每张食物卡片显示一张 AI 生成的食物插画。

- **存储**：`public/food-illustrations/food-{1-N}.png`（当前 33 张，400px 宽，总计 ~3.3MB）
- **常量**：`src/types/index.ts` 中 `FOOD_ILLUSTRATION_COUNT`
- **分配**：新建食物时随机分配 `randomIllustration()`，编辑时可通过横向滚动选择器手动选择
- **数据库字段**：`food_items.illustration`（整数，1-indexed）
- **管理脚本**：`pnpm illustrations` 或 `.cursor/skills/process-image-assets/scripts/`

## 卡片背景系统

12 张透明背景 PNG 作为卡片视觉本体（含虚线边框和装饰圆点）。

- **存储**：`public/card-backgrounds/card-{1-12}.png`
- **常量**：`src/types/index.ts` 中 `CARD_BG_COUNT`
- **分配**：`getCardBgPath(foodId)` 使用 ID + 会话盐哈希，每次重启随机但运行中稳定
- **素材来源**：GPT 生成 4x3 合并图 → Python 脚本拆分（`.cursor/skills/process-image-assets/scripts/split_grid.py`）

## 数据库设计

SQLite，文件位置：`%APPDATA%/com.tssh.nezumi-hole/nezumihole.db`

### 表结构

**categories** — id, name, icon, parentId, sortOrder（无 FK 约束）

**food_items** — id, name, categoryId, region, location, source, items(JSON), rating, notes, images(JSON), illustration, isFavorite, createdAt, updatedAt（无 FK 约束）

### 关键技术决策

1. **不使用 FOREIGN KEY 约束** — `tauri-plugin-sql` 的连接池实现导致 `PRAGMA foreign_keys` 跨连接失效
2. **INSERT 拆分** — 14 参数的 `INSERT` 拆为 8 参数 `INSERT OR REPLACE` + 7 参数 `UPDATE`，因为 Tauri SQL 插件的 `$10`+ 参数解析有问题
3. **参数格式** — 使用 `$N`（不是 `?N`），这是 Tauri SQL 插件对 SQLite 的约定
4. **初始化容错** — `getSqliteDb()` 中若 `initSqliteTables()` 失败，重置 `sqliteDb = null` 以便下次重试
5. **浏览器降级** — 开发时浏览器访问 `localhost:1420` 使用内存存储，无需 SQLite

### 初始数据

138 条美食记录，来源于个人收录。文件：
- `src/data/initial-categories.ts` — 分类定义
- `src/data/initial-foods.ts` — 美食条目

分类结构：狗粮（狗罐/狗鲜食）、餐厅美食（按地区细分 6 个子分类）、零食、饮品、想尝试

## Tauri 配置

### 权限 (capabilities)

`src-tauri/capabilities/default.json` 中需要包含以下 SQL 权限：
```json
["sql:default", "sql:allow-load", "sql:allow-execute", "sql:allow-select", "sql:allow-close"]
```

### 环境变量（国内镜像加速）

```
RUSTUP_DIST_SERVER=https://rsproxy.cn
RUSTUP_UPDATE_ROOT=https://rsproxy.cn/rustup
TAURI_BUNDLER_TOOLS_GITHUB_MIRROR=https://ghfast.top
```

## 项目结构

```
NezumiHole/
├── README.md               # 面向用户的快速上手指南
├── .cursor/
│   ├── rules/PROJECT.md    # 本文档（AI 上下文）
│   └── skills/
│       └── process-image-assets/  # 图片素材处理 Skill
│           ├── SKILL.md
│           └── scripts/    # split_grid.py, compress_images.py, deploy_assets.py
├── src-tauri/              # Tauri/Rust 后端
│   ├── src/lib.rs          # 应用入口 + 插件注册
│   ├── capabilities/       # 权限配置
│   └── tauri.conf.json     # 窗口/应用配置
├── public/
│   ├── food-illustrations/ # 食物插画 food-{1-33}.png
│   └── card-backgrounds/   # 卡片背景 card-{1-12}.png
├── src/                    # React 前端
│   ├── components/
│   │   ├── layout/Sidebar.tsx
│   │   └── ui/             # FoodCard, FoodForm, FoodDetail, SearchBar, RandomWheel, ThemeSwitcher
│   ├── themes/theme.css    # 主题 CSS 变量
│   ├── hooks/              # useTheme, useSound
│   ├── store/              # useAppStore (Zustand-like)
│   ├── types/index.ts      # 类型定义 + 插画/背景常量和工具函数
│   ├── data/               # 初始数据
│   ├── lib/database.ts     # 数据库操作层
│   ├── styles.css          # 全局样式 + 主题特定样式
│   └── App.tsx             # 主应用组件
├── scripts/                # 插画管理脚本
├── 素材/                    # AI 生成的原始素材（不纳入打包）
└── package.json
```

## 当前进度与 TODO

### 进行中

- **可爱主题视觉打磨** — 色调已从纯粉调整为暖杏桃色，卡片背景图系统已实现。下一步：生成更高精度的卡片背景图替换当前低分辨率版本
- **继续生成插画素材** — 用 GPT 生成更多食物插画、更精细的卡片背景

### 待完成

- [ ] 可爱主题添加更多手绘装饰元素（小老鼠吉祥物、背景纹理）
- [ ] 更多主题（暖色美食风、简约清新风、暗黑高级风等）
- [ ] 晶莹剔透主题突破（SVG filter / WebGL）
- [ ] 卡片背景图升级为高分辨率精细版本

### 已知问题

- PowerShell 执行策略可能阻止 pnpm 运行，需 `Set-ExecutionPolicy Bypass -Scope Process`
- 晶莹剔透主题视觉效果仍有提升空间
