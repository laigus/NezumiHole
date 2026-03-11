# 耗耗洞 NezumiHole

> 像小老鼠一样，把所有好吃好喝的都囤进洞里。

一个记录个人美食收藏的桌面应用，帮助你整理买过的好吃好喝的东西，方便以后想吃时快速找到。

> **注意：本文档会随着项目开发进度持续更新。** 每次完成新功能或重大变更时，都应同步更新本文档中的进度和说明，确保文档始终反映项目最新状态。

## 开发进度

### 已完成

- [x] 项目初始化（Tauri 2 + React + TypeScript + Vite）
- [x] Git 仓库初始化
- [x] Tailwind CSS 4 + Framer Motion + Howler.js 依赖配置
- [x] 双主题系统架构（可爱插画风 + 玻璃质感风，含深色模式切换）
- [x] 分类侧边栏导航（动态分类，可扩展）
- [x] 美食卡片网格展示（带入场动画、悬浮动效）
- [x] 模糊搜索功能（支持搜索店名、菜品、品牌、地区、渠道）
- [x] 收藏/取消收藏功能
- [x] 随机推荐"今天吃什么"（骰子旋转动画）
- [x] 主题切换 + 深色模式切换设置面板
- [x] 全部 138 条初始美食数据录入（狗粮/餐厅/零食/饮品/想尝试）
- [x] 打包为 Windows exe（NSIS ~3MB, MSI ~4.4MB）
- [x] SQLite 数据库集成（Tauri 环境持久化，浏览器开发模式自动降级到内存存储）
- [x] 数据库表结构（categories + food_items）
- [x] 完整 CRUD 操作（增删改查）
- [x] 美食详情弹窗（点击卡片查看完整信息，含收藏/编辑/删除按钮）
- [x] 添加新美食记录（表单弹窗，支持所有字段）
- [x] 编辑已有美食记录（复用表单组件）
- [x] 删除美食记录（带确认弹窗）
- [x] 分类管理（新增/编辑/删除大分类和子分类，树形展示）
- [x] 数据导出（JSON 格式下载）
- [x] 数据导入（JSON 文件上传，覆盖现有数据）

- [x] 子分类快捷筛选栏（点击标签一键筛选，如餐厅按地区、零食按类型）
- [x] LXGW WenKai 手写字体引入（CDN，系统字体降级）
- [x] 玻璃质感主题完善（渐变背景、磨砂卡片、光影效果）
- [x] Web Audio API 合成音效系统（点击、收藏叮咚、随机推荐、主题切换、删除、添加）
- [x] 主题系统重构：原"玻璃"主题重命名为"磨砂玻璃"（frosted），新增"晶莹剔透"（liquid-glass）主题
- [x] 晶莹剔透主题 — 3D 厚玻璃方案初版实现（5 层 CSS 叠加：厚度渐变 + specular highlight + 棱镜色散边框 + 多层阴影 + 方向性边框）
- [x] **可爱插画风主题全面升级**（粉色系配色、手绘风格卡片虚线边框、侧边栏凸出标签效果、心形装饰、✿ 装饰元素等）
- [x] **食物插画系统**（33 种 AI 生成食物插画，每张卡片随机分配，编辑时可横向滚动选择）
- [x] **SQLite 参数兼容性修复** — 将 14 参数 INSERT 拆分为 8 参数 INSERT + 7 参数 UPDATE 两步操作，解决 Tauri SQL 插件 `$10`+ 参数解析问题
- [x] **数据库外键约束移除** — 移除 categories 和 food_items 表的 FOREIGN KEY 约束，避免 Tauri SQL 插件中 PRAGMA 跨连接失效问题
- [x] **开发/打包环境配置** — Node.js、pnpm、Rust、VS Build Tools 2022 全套安装，配置国内镜像（Rustup、Tauri Bundler GitHub Mirror）

### 进行中 / 痛点

- [ ] **[痛点] 晶莹剔透主题的"晶莹感"不足** — 当前纯 CSS 实现已经过多轮调整，但仍缺少真实玻璃的通透感。可能的突破方向：SVG filter、WebGL shader、高质量玻璃纹理贴图等
- [ ] **[痛点] 卡片动画性能问题** — 当分类下条目较多时（如餐厅美食），首屏卡片动画播完后，后续卡片仍在依次做入场动画，体验差。需要优化：只对可视区域内的卡片播放动画，或限制同时动画的卡片数量
- [ ] **继续生成插画素材** — 用 GPT 生成更多食物插画，丰富卡片视觉效果
- [ ] **动态插画管理脚本** — 实现一个脚本工具，自动压缩新图片并放入 `public/food-illustrations/`，自动更新 `FOOD_ILLUSTRATION_COUNT`，无需手动修改代码

### 待完成

- [ ] 可爱插画风添加更多手绘风装饰元素（小老鼠吉祥物、背景纹理等）
- [ ] 更多主题（暖色美食风、简约清新风、暗黑高级风等）

## 技术栈

- **框架**: Tauri 2 (Rust) + React 18 + TypeScript
- **构建工具**: Vite
- **包管理**: pnpm
- **样式**: Tailwind CSS 4 + CSS Variables（主题系统）
- **动效**: Framer Motion
- **音效**: Howler.js
- **字体**: LXGW WenKai（落霞与孤鹜文楷）— 温暖可爱的中文手写风字体
- **数据存储**: SQLite（通过 Tauri 插件 tauri-plugin-sql）
- **图标**: Lucide React

## 功能列表

### 核心功能

- **分类浏览**: 按动态分类查看（狗粮、餐厅美食、零食、饮品、想尝试清单等，分类可随时扩展）
- **地区筛选**: 按城市和区域筛选（上海-徐汇、上海-临港、广州等）
- **搜索**: 模糊搜索店名、菜品名、品牌名
- **收藏标星**: 标记最爱的美食，快速访问
- **增删改查**: 添加新记录、编辑已有记录、删除不需要的
- **分类管理**: 在设置中新增/编辑/删除/排序大分类和子分类（支持多级层级）
- **随机推荐**: "今天吃什么？"摇一摇随机推荐，附带转盘动画
- **数据导入导出**: 支持 JSON 格式备份和恢复

### UI/UX 特性

- **多主题系统**（可扩展架构，后续可持续添加新主题）:
  - 可爱插画风：柔和色彩、圆角卡片、手绘风插图装饰
  - 磨砂玻璃（frosted）：磨砂玻璃背景、半透明面板、朦胧质感
  - 晶莹剔透（liquid-glass）：3D 厚玻璃风格、specular highlight、棱镜色散边框、多层阴影立体感（持续优化中）
- **丝滑动效**: 页面切换滑动、卡片悬浮弹起、添加时弹跳、列表滚动视差
- **交互音效**: 按钮点击轻响、收藏时叮咚、随机推荐转盘音、主题切换音
- **响应式卡片布局**: 网格/列表视图切换
- **深色模式支持**: 每个主题均有对应的深色版本

## 数据结构

### Category（分类 — 动态可扩展）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string (UUID) | 唯一标识 |
| name | string | 分类名称（如：狗粮、餐厅、零食、饮品、猫粮…） |
| icon | string | 分类图标标识 |
| parentId | string \| null | 父分类 ID，为空则是大分类，有值则是子分类 |
| sortOrder | number | 排序顺序 |

### FoodItem（美食条目）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string (UUID) | 唯一标识 |
| name | string | 名称（店名/品牌名） |
| categoryId | string (FK) | 关联的分类 ID（支持多级分类） |
| region | string \| null | 地区（上海-徐汇/上海-临港/广州-西华路等） |
| location | string \| null | 具体位置（商场名/路名） |
| source | string \| null | 购买渠道（抖音/淘宝/盒马/线下等） |
| items | string[] | 具体菜品/商品列表 |
| rating | number \| null | 评分 1-5 |
| notes | string \| null | 备注 |
| images | string[] | 图片路径列表 |
| illustration | number | 食物插画编号（1-33，对应 `public/food-illustrations/food-N.png`）|
| isFavorite | boolean | 是否收藏 |
| createdAt | datetime | 创建时间 |
| updatedAt | datetime | 更新时间 |

## 项目结构

```
NezumiHole/
├── PROJECT.md              # 项目文档（本文件，持续更新）
├── src-tauri/              # Tauri/Rust 后端
│   ├── src/
│   │   ├── lib.rs          # Tauri 应用入口 + 插件注册
│   │   └── main.rs         # Windows 入口
│   ├── capabilities/       # Tauri 权限配置（SQL 插件等）
│   ├── Cargo.toml
│   └── tauri.conf.json     # Tauri 配置（窗口大小、应用名等）
├── public/
│   └── food-illustrations/ # 食物插画（food-1.png ~ food-33.png，400px 宽，约 3.3MB 总计）
├── src/                    # React 前端
│   ├── assets/             # 静态资源
│   │   ├── sounds/         # 音效文件
│   │   ├── fonts/          # 字体文件
│   │   └── illustrations/  # 插画素材
│   ├── components/
│   │   ├── layout/         # 布局组件（Sidebar）
│   │   └── ui/             # UI 组件（FoodCard, FoodForm, SearchBar, RandomWheel, ThemeSwitcher）
│   ├── themes/             # 主题 CSS 变量 + 主题切换逻辑（theme.css）
│   ├── hooks/              # 自定义 Hooks（useTheme, useSound）
│   ├── store/              # 状态管理（useAppStore）
│   ├── types/              # TypeScript 类型定义（含 FOOD_ILLUSTRATION_COUNT 等）
│   ├── data/               # 初始数据（categories, foods）
│   ├── lib/                # 数据库操作（database.ts）
│   ├── App.tsx             # 主应用组件
│   ├── main.tsx            # React 入口
│   └── styles.css          # 全局样式 + 主题特定样式
├── 素材/                    # 原始素材（AI 生成的插画原图等）
├── package.json
├── tsconfig.json
├── vite.config.ts
└── .gitignore
```

## 开发指南

### 环境要求

- Node.js >= 18
- pnpm >= 8
- Rust（通过 rustup 安装）
- Visual Studio Build Tools 2022（含"使用 C++ 的桌面开发"工作负载）
- Tauri CLI（通过 pnpm 的 @tauri-apps/cli 已包含）

**国内镜像配置**（加速下载）：
```powershell
$env:RUSTUP_DIST_SERVER = "https://rsproxy.cn"
$env:RUSTUP_UPDATE_ROOT = "https://rsproxy.cn/rustup"
$env:TAURI_BUNDLER_TOOLS_GITHUB_MIRROR = "https://ghfast.top"
```

### 常用命令

```bash
pnpm install          # 安装依赖
pnpm dev              # 仅启动前端开发服务器（localhost:1420）
pnpm tauri dev        # 启动 Tauri 桌面应用开发模式（含前端热重载）
pnpm tauri build      # 打包为 exe（输出到 src-tauri/target/release/bundle/）
```

### 打包为 exe

执行 `pnpm tauri build` 后，打包产物位于：

```
src-tauri/target/release/bundle/
├── nsis/               # NSIS 安装包（.exe 安装程序）
│   └── NezumiHole_0.1.0_x64-setup.exe
└── msi/                # MSI 安装包
    └── NezumiHole_0.1.0_x64_en-US.msi
```

NSIS 安装包是推荐的分发格式，双击即可安装运行。

**打包环境要求**：Windows 上需要安装 Visual Studio Build Tools 2022 并包含"使用 C++ 的桌面开发"工作负载（提供 MSVC 编译器和链接器）。

**当前打包体积**：
- NSIS setup.exe: ~3MB
- MSI: ~4.4MB

### 数据库

使用 SQLite 本地数据库（通过 `tauri-plugin-sql`），数据文件存储在 `%APPDATA%/com.tssh.nezumi-hole/nezumihole.db`。首次启动时自动创建表结构并导入初始数据。浏览器开发模式下自动降级为内存存储。

**注意事项**：
- 表定义不使用 FOREIGN KEY 约束（Tauri SQL 插件的 PRAGMA 跨连接失效）
- 14+ 参数的 INSERT 拆分为多步操作（Tauri SQL 插件 `$10`+ 参数解析问题）
- 如需清除数据重新初始化，删除上述 db 文件并重启应用即可

## 初始数据

项目内置初始美食数据（来源于个人记录），首次启动时自动加载。数据文件位于：

- `src/data/initial-categories.ts` — 分类定义
- `src/data/initial-foods.ts` — 美食条目（138 条）

### 默认分类结构

- **狗粮**
  - 狗罐
  - 狗鲜食
- **餐厅美食**（按地区细分：通用/徐汇/漕河泾/静安/临港/广州）
- **零食**
- **饮品**
- **想尝试**

### 数据概览

- **狗粮/狗鲜食**: 抖音卟叮、布丁妹妹、益和、爵宴、异语宠物鲜食、乖乖福、搬鲜Mfresh
- **餐厅美食**: 按地区分类
  - 通用：蜀里成都、城南小馆、太二、费大厨、吉野家、平田拉面等
  - 徐汇：美罗城（肉肉大米、一风堂、回转寿司等）、MIND·YAKINIKU
  - 漕河泾：西域盛宴、神田川、大志烧肉、虎丸烧肉
  - 静安：ROU Yakiniku
  - 临港：古田稻香、避风塘、楼兰新疆、合兴发茶冰室等（30+ 家）
  - 广州：西华路美食、甘思咪哚
- **零食**: 银鱼肉丝、白色恋人、UFO炒面、扇屋鳕鱼奶酪条等（40+ 种）
- **饮品**: 轻上、可漾、喜茶、香飘飘等
- **想尝试**: 胖bird、琦岩家拉面、N多寿司等待打卡清单
