---
description: NezumiHole 项目的完整架构、设计、实现细节和修改指南。AI 在丢失上下文时应优先阅读此文档。
globs:
  - "**/*"
---

# 耗耗洞 NezumiHole — 项目文档

> 像小老鼠一样，把所有好吃好喝的都囤进洞里。

个人美食收藏桌面应用。记录买过的好吃好喝的东西，按分类/地区/渠道整理，方便以后想吃时快速找到。

---

## 1. 技术架构总览

| 层 | 技术 | 说明 |
|----|------|------|
| 桌面壳 | **Tauri 2** (Rust) | 轻量桌面容器，NSIS 安装包 ~3MB |
| 前端 | **React 19** + TypeScript | SPA 单页应用 |
| 构建 | **Vite 7** + pnpm | 快速构建与 HMR |
| 样式 | **CSS Variables** 主题系统 + Tailwind CSS 4 | 三套主题 + 深色模式 |
| 动效 | **Framer Motion** | 卡片入场、悬浮、页面切换 |
| 音效 | **Web Audio API** | 合成音效（点击/收藏/推荐/切换/删除/添加） |
| 字体 | **寒蝉全圆体**（cute 主题）+ **LXGW WenKai**（其他主题） | 均本地加载，无需网络 |
| 数据库 | **SQLite** via `tauri-plugin-sql` | 桌面端持久化，浏览器端降级为内存 |
| 图标 | **Lucide React** | 卡片内可爱手绘爱心为自定义 SVG |

### 依赖包（package.json）

- `@tauri-apps/api` — Tauri 前端 API（窗口控制、事件等）
- `@tauri-apps/plugin-sql` — SQLite 数据库插件
- `framer-motion` — 动画库
- `lucide-react` — 图标库
- `lxgw-wenkai-webfont` — 霞鹜文楷字体（npm 包，本地加载 woff2 子集）
- `uuid` — 生成唯一 ID
- `react-router-dom` — 路由（当前未深度使用）

---

## 2. 项目结构

```
NezumiHole/
├── README.md                    # 面向用户的快速上手指南
├── index.html                   # 入口 HTML（无外部 CDN 依赖）
├── package.json
├── vite.config.ts
├── tsconfig.json
│
├── .cursor/
│   ├── rules/PROJECT.md         # 本文档（AI 上下文，Cursor Rule）
│   └── skills/
│       └── process-image-assets/  # 图片素材处理 Skill
│           ├── SKILL.md
│           └── scripts/           # split_grid.py, compress_images.py, deploy_assets.py
│
├── src-tauri/                   # Tauri/Rust 后端
│   ├── src/lib.rs               # 应用入口 + 插件注册
│   ├── Cargo.toml               # Rust 依赖
│   ├── tauri.conf.json          # 窗口/应用/打包配置
│   ├── capabilities/default.json # 权限声明（SQL + 窗口操作）
│   └── icons/                   # 应用图标（32/128/256/ico/png）
│
├── public/                      # 静态资源（Vite 直接复制到构建产物）
│   ├── fonts/
│   │   └── ChillRoundF-Regular.ttf  # 寒蝉全圆体（5.9MB，cute 主题字体）
│   ├── food-illustrations/      # 食物插画 food-{1-32}.png
│   ├── card-backgrounds/        # 卡片背景 card-{1-16}.png
│   ├── main-bg.jpg              # 主界面背景图（粉色云朵）
│   ├── hamster-icon.png         # 仓鼠图标（侧边栏标题 + 应用图标来源）
│   ├── title-deco.png           # 标题旁草莓装饰
│   ├── search-heart.png         # 搜索栏右侧爱心装饰
│   ├── divider.png              # 侧边栏草莓分割线
│   └── favicon.png              # 网页 favicon
│
├── src/                         # React 前端源码
│   ├── main.tsx                 # 入口：挂载 React + 导入字体 CSS
│   ├── App.tsx                  # 主应用组件（布局 + 状态编排）
│   ├── styles.css               # 全局样式 + 所有主题特定样式
│   ├── themes/theme.css         # 主题 CSS 变量定义
│   ├── types/index.ts           # TypeScript 类型 + 插画/背景常量和工具函数
│   ├── lib/database.ts          # 数据库操作层（SQLite CRUD）
│   ├── store/index.ts           # 全局状态管理（类 Zustand）
│   ├── hooks/
│   │   ├── useTheme.ts          # 主题切换 Hook
│   │   └── useSound.ts          # 音效 Hook
│   ├── data/
│   │   ├── initial-categories.ts # 初始分类数据
│   │   └── initial-foods.ts      # 初始美食数据（138 条）
│   └── components/
│       ├── layout/
│       │   ├── Sidebar.tsx       # 侧边栏导航
│       │   └── TitleBar.tsx      # 自定义标题栏（仅 Tauri 环境显示）
│       └── ui/
│           ├── FoodCard.tsx      # 食物卡片（含 CuteHeart SVG 组件）
│           ├── FoodForm.tsx      # 添加/编辑食物表单（含插画选择器）
│           ├── FoodDetail.tsx    # 食物详情弹窗
│           ├── SearchBar.tsx     # 搜索栏
│           ├── SubCategoryFilter.tsx # 子分类筛选
│           ├── RandomWheel.tsx   # 随机推荐转盘
│           ├── ThemeSwitcher.tsx # 主题/设置面板
│           ├── CategoryManager.tsx # 分类管理
│           ├── DataManager.tsx   # 数据导入导出
│           └── ConfirmDialog.tsx # 确认对话框
│
├── scripts/
│   ├── manage-illustrations.mjs  # 插画管理脚本（pnpm illustrations）
│   └── generate_icons.py         # 从 hamster-icon.png 生成应用图标
│
└── 素材/                         # AI 生成的原始素材（不纳入打包，.gitignore）
```

---

## 3. 界面布局与交互

### 整体布局

```
┌─────────────────────────────────────────────────────────┐
│ [自定义标题栏 — 仅 Tauri]              [─] [□] [×]     │ ← 32px 高，fixed 定位
├──────────┬──────────────────────────────────────────────┤
│ 侧边栏    │  标题 + 装饰 + 记录数        [+ 添加美食]   │ ← 固定不滚动
│ 240px     │  [搜索栏 🔍                         ♥]     │ ← 固定不滚动
│           │  [子分类筛选标签]                            │ ← 固定不滚动
│ 🐹 耗耗洞 │ ─────────────────────────────────────────── │
│ ──分割线── │  ┌──────┐ ┌──────┐ ┌──────┐               │
│ 全部       │  │ 卡片1 │ │ 卡片2 │ │ 卡片3 │              │ ← 仅此区域滚动
│ ──────── │  └──────┘ └──────┘ └──────┘               │   (.main-scroll-area)
│ 狗粮       │  ┌──────┐ ┌──────┐ ┌──────┐               │
│ 餐厅美食   │  │ 卡片4 │ │ 卡片5 │ │ 卡片6 │              │
│ 零食       │  └──────┘ └──────┘ └──────┘               │
│ 饮品       │                                            │
│ 想尝试     │                                            │
│ ──────── │                                            │
│ 我的收藏   │                                            │
│ 随机推荐   │                                            │
│            │                                            │
│ 设置       │                                            │
└──────────┴──────────────────────────────────────────────┘
```

### 关键 CSS 类与布局关系

| CSS 类 | 元素 | 说明 |
|--------|------|------|
| `.app-container` | 最外层 div | `display: flex; height: 100vh;` 水平排列 sidebar + main |
| `.app-container.has-titlebar` | 有标题栏时 | `padding-top: 32px` 为标题栏留空间 |
| `.titlebar` | 自定义标题栏 | `position: fixed; top:0; height: 32px; z-index: 9999` |
| `.sidebar` | 左侧导航 | `width: 240px; height: 100%; flex-direction: column` |
| `.main-content` | 右侧主区域 | `flex: 1; display: flex; flex-direction: column; overflow: hidden` |
| `.main-header` | 标题行 | 固定在 main-content 顶部 |
| `.search-bar` | 搜索栏 | 固定在 main-header 下方 |
| `.main-scroll-area` | 可滚动区域 | `flex: 1; overflow-y: auto;` 仅卡片区域滚动 |
| `.food-grid` | 卡片网格 | `display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))` |
| `.food-card` | 单张卡片 | cute 主题下无 CSS 边框，由背景图充当卡片 |

### 自定义标题栏（TitleBar.tsx）

- **仅在 Tauri 环境显示**：通过 `"__TAURI_INTERNALS__" in window` 检测
- **窗口控制**：调用 `@tauri-apps/api/window` 的 `minimize()`, `toggleMaximize()`, `close()`
- **拖拽移动**：`onMouseDown` 调用 `appWindow.startDragging()`
- **双击最大化**：`onDoubleClick` 调用 `appWindow.toggleMaximize()`
- **Tauri 配置**：`decorations: false`（隐藏原生标题栏）
- **所需权限**：`core:window:allow-minimize`, `core:window:allow-toggle-maximize`, `core:window:allow-close`, `core:window:allow-is-maximized`, `core:window:allow-start-dragging`

---

## 4. 主题系统

三套主题，均含深色模式变体。通过 `data-theme` 和 `data-color-mode` 属性切换。

### 修改主题的方法

1. **修改颜色变量**：编辑 `src/themes/theme.css` 中对应主题的 CSS 变量
2. **修改主题特定样式**：编辑 `src/styles.css` 中 `[data-theme="xxx"]` 选择器
3. **添加新主题**：在 `theme.css` 中新增变量块 + `styles.css` 中新增特定样式 + `useTheme.ts` 中注册

### 可爱插画风 (cute) — 当前主打主题

- **色调**：暖杏桃色调（非纯粉色），参考 `素材/ChatGPT Image 2026年3月11日 22_24_23.png`
- **字体**：寒蝉全圆体（圆润可爱），本地 TTF 加载（`public/fonts/ChillRoundF-Regular.ttf`）
- **CSS 变量定义**：`src/themes/theme.css` 中 `:root[data-theme="cute"]`
- **主题特定样式**：`src/styles.css` 中所有 `[data-theme="cute"]` 选择器
- **卡片**：无 CSS 边框/背景，由卡片背景图（`public/card-backgrounds/`）直接作为卡片视觉本体
- **背景图分配**：`getCardBgPath(foodId)` 基于食物 ID + 会话盐哈希（同一次启动内稳定，跨重启随机）
- **卡片内容 padding**：`20px 24px 22px`，避开背景图内部虚线边框
- **爱心图标**：自定义宽扁 SVG（`CuteHeart` 组件，定义在 `FoodCard.tsx` 内）
- **侧边栏**：半透明磨砂（`rgba(255,240,235,0.35)` + `backdrop-filter: blur(16px)`），阴影投射到主界面
- **装饰元素**：仓鼠图标、草莓分割线、标题旁草莓、搜索栏爱心
- **主背景**：`main-bg.jpg` 设置在 `body` 上（`background: url('/main-bg.jpg') center / cover no-repeat fixed`），侧边栏透过此背景产生磨砂效果

### 磨砂玻璃 (frosted)

- 磨砂玻璃背景（`backdrop-filter: blur`）、半透明面板

### 晶莹剔透 (liquid-glass)

- 3D 厚玻璃风格：5 层 CSS 叠加
- **痛点**：纯 CSS 实现的"晶莹感"不足，可能需要 SVG filter / WebGL shader

---

## 5. 食物插画系统

每张食物卡片显示一张 AI 生成的食物插画。

- **存储**：`public/food-illustrations/food-{1-N}.png`（当前 32 张）
- **常量**：`src/types/index.ts` → `FOOD_ILLUSTRATION_COUNT`
- **分配**：新建食物时 `randomIllustration()` 随机分配，编辑时可通过横向滚动选择器手动选择
- **数据库字段**：`food_items.illustration`（整数，1-indexed）
- **路径函数**：`getFoodIllustrationPath(n)` → `/food-illustrations/food-${n}.png`

### 添加新插画

1. 将新图片放入 `public/food-illustrations/`，命名为 `food-{N}.png`
2. 更新 `src/types/index.ts` 中的 `FOOD_ILLUSTRATION_COUNT`
3. 或使用 `pnpm illustrations` 脚本自动管理
4. 或使用 `.cursor/skills/process-image-assets/` Skill 处理合并图

---

## 6. 卡片背景系统

16 张透明背景 PNG 作为卡片视觉本体（含虚线边框和装饰圆点），仅 cute 主题使用。

- **存储**：`public/card-backgrounds/card-{1-16}.png`
- **常量**：`src/types/index.ts` → `CARD_BG_COUNT`
- **分配**：`getCardBgPath(foodId)` 使用 ID + 会话盐哈希，每次重启随机但运行中稳定
- **CSS**：`.food-card-bg` 绝对定位覆盖卡片，`object-fit: fill`
- **hover 效果**：`filter: drop-shadow(...)` 直接应用在 `.food-card-bg` 上（非 `box-shadow`，以跟随图片形状）
- **素材来源**：GPT 生成 4x4 合并图 → Python 脚本拆分

### 替换卡片背景

1. 准备新的合并图（4x4 网格）
2. 使用 `.cursor/skills/process-image-assets/scripts/split_grid.py` 拆分
3. 将拆分后的图片放入 `public/card-backgrounds/`
4. 更新 `src/types/index.ts` 中的 `CARD_BG_COUNT`

---

## 7. 数据库设计

SQLite，文件位置：`%APPDATA%/com.tssh.nezumi-hole/nezumihole.db`

### 表结构

**categories** — `id`, `name`, `icon`, `parentId`, `sortOrder`（无 FK 约束）

**food_items** — `id`, `name`, `categoryId`, `region`, `location`, `source`, `items`(JSON), `rating`, `notes`, `images`(JSON), `illustration`, `isFavorite`, `createdAt`, `updatedAt`（无 FK 约束）

### 关键技术决策

1. **不使用 FOREIGN KEY 约束** — `tauri-plugin-sql` 的连接池实现导致 `PRAGMA foreign_keys` 跨连接失效
2. **INSERT 拆分** — 14 参数的 `INSERT` 拆为 8 参数 `INSERT OR REPLACE` + 7 参数 `UPDATE`，因为 Tauri SQL 插件的 `$10`+ 参数解析有 bug
3. **参数格式** — 使用 `$N`（不是 `?N`），这是 Tauri SQL 插件对 SQLite 的约定
4. **初始化容错** — `getSqliteDb()` 中若 `initSqliteTables()` 失败，重置 `sqliteDb = null` 以便下次重试
5. **浏览器降级** — 开发时浏览器访问 `localhost:1420` 使用内存存储，无需 SQLite

### 修改数据库的方法

- **表结构变更**：编辑 `src/lib/database.ts` 中的 `CREATE TABLE` 语句
- **CRUD 操作**：编辑 `src/lib/database.ts` 中对应的函数
- **初始数据**：编辑 `src/data/initial-categories.ts` 和 `src/data/initial-foods.ts`
- **重置数据库**：删除 `%APPDATA%/com.tssh.nezumi-hole/nezumihole.db*` 文件

---

## 8. Tauri 配置

### 窗口配置（tauri.conf.json）

- `decorations: false` — 隐藏 Windows 原生标题栏，使用自定义 TitleBar
- `width: 1024, height: 720, minWidth: 800, minHeight: 600`
- `transparent: false`

### 权限（capabilities/default.json）

```json
[
  "core:default",
  "core:window:allow-minimize",
  "core:window:allow-toggle-maximize",
  "core:window:allow-close",
  "core:window:allow-is-maximized",
  "core:window:allow-start-dragging",
  "core:window:allow-set-focus",
  "opener:default",
  "sql:default",
  "sql:allow-load",
  "sql:allow-execute",
  "sql:allow-select",
  "sql:allow-close"
]
```

> **重要**：添加新的 Tauri API 调用时，必须在此文件中添加对应权限，否则会报 `xxx not allowed` 错误。

### 应用图标

- 来源：`public/hamster-icon.png`（可爱仓鼠）
- 生成脚本：`scripts/generate_icons.py`（Python + Pillow）
- 输出：`src-tauri/icons/` 下的 `32x32.png`, `128x128.png`, `128x128@2x.png`, `icon.png`, `icon.ico`
- 同时生成 `public/favicon.png` 用于网页

### 环境变量（国内镜像加速）

```
RUSTUP_DIST_SERVER=https://rsproxy.cn
RUSTUP_UPDATE_ROOT=https://rsproxy.cn/rustup
TAURI_BUNDLER_TOOLS_GITHUB_MIRROR=https://ghfast.top
```

---

## 9. 字体系统

两套字体均本地加载，不依赖外部 CDN：

| 字体 | 用途 | 加载方式 | 文件 |
|------|------|----------|------|
| 寒蝉全圆体 (ChillRoundF) | cute 主题优先 | `@font-face` 引用本地 TTF | `public/fonts/ChillRoundF-Regular.ttf` (5.9MB) |
| LXGW WenKai (霞鹜文楷) | 其他主题 + cute 后备 | npm 包 `lxgw-wenkai-webfont`，在 `main.tsx` 中 import CSS | `node_modules/lxgw-wenkai-webfont/` (woff2 子集) |

- `@font-face` 声明在 `src/styles.css` 顶部
- 字体引用在 `src/themes/theme.css` 的 `--font-heading` / `--font-body` 变量中

---

## 10. 常用开发命令

```bash
pnpm dev              # 启动 Vite 开发服务器（浏览器访问 localhost:1420）
pnpm tauri dev        # 启动 Tauri 桌面开发模式（含热重载）
pnpm build            # 构建前端
pnpm tauri build      # 构建桌面安装包
pnpm illustrations    # 管理食物插画
```

---

## 11. 当前进度与 TODO

### 进行中

- **可爱主题视觉打磨** — 色调已从纯粉调整为暖杏桃色，卡片背景图系统已实现，字体已切换为寒蝉全圆体
- **继续生成插画素材** — 用 GPT 生成更多食物插画、更精细的卡片背景

### 待完成

- [ ] **PWA 手机版 (iOS)** — 详见 `.cursor/rules/MOBILE-SYNC-PLAN.md`
- [ ] **Cloudflare D1 云同步** — 详见 `.cursor/rules/MOBILE-SYNC-PLAN.md`
- [ ] 可爱主题添加更多手绘装饰元素（小老鼠吉祥物、背景纹理）
- [ ] 更多主题（暖色美食风、简约清新风、暗黑高级风等）
- [ ] 晶莹剔透主题突破（SVG filter / WebGL）
- [ ] 卡片背景图升级为高分辨率精细版本
- [x] 卡片动画性能优化（whileInView + 延迟上限 + React.memo）
- [x] 标题栏融入主内容区（不再单独占一行，改为浮动拖拽区域 + 右上角按钮）
- [x] 卡片阴影截断修复（滚动区域 padding/margin 补偿 + 阴影微调）

### 已知问题

- PowerShell 执行策略可能阻止 pnpm 运行，需 `Set-ExecutionPolicy Bypass -Scope Process`
- 晶莹剔透主题视觉效果仍有提升空间
- 寒蝉全圆体 TTF 文件较大（5.9MB），可考虑转为 woff2 子集以减小体积

---

## 12. 快速修改指南

### 想修改颜色/配色？
→ 编辑 `src/themes/theme.css` 中对应主题的 CSS 变量

### 想修改卡片样式？
→ 编辑 `src/styles.css` 中 `.food-card` 相关选择器（cute 主题用 `[data-theme="cute"] .food-card`）

### 想修改布局？
→ 编辑 `src/styles.css` 中 `.app-container`, `.sidebar`, `.main-content`, `.main-scroll-area` 等

### 想添加新的装饰图片？
→ 放入 `public/`，在对应组件中添加 `<img>` 标签，在 `styles.css` 中添加样式（默认隐藏，cute 主题显示）

### 想修改数据库表结构？
→ 编辑 `src/lib/database.ts` 中的 `CREATE TABLE` + 对应 CRUD 函数 + `src/types/index.ts` 中的接口

### 想添加新的 Tauri API 调用？
→ 在 `src-tauri/capabilities/default.json` 中添加权限 → 前端 import 对应 API 使用

### 想修改应用图标？
→ 替换 `public/hamster-icon.png` → 运行 `.venv/Scripts/python.exe scripts/generate_icons.py`
