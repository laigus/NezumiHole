---
description: NezumiHole 手机版 + 云同步方案。PWA (iOS/Android) + Cloudflare D1 数据同步。
globs:
  - "**/*"
---

# 耗耗洞 — 手机版 + 云同步方案

## 总体架构

```
┌──────────────────┐     HTTPS      ┌──────────────────────┐
│  桌面端 (Windows) │ ◄────────────► │  Cloudflare Worker   │
│  Tauri 2 Desktop │                │  (REST API 代理)      │
│  SQLite 本地      │                │         │             │
└──────────────────┘                │    Cloudflare D1     │
                                    │    (云端 SQLite)      │
┌──────────────────┐     HTTPS      │                      │
│  手机端 (iPhone)  │ ◄────────────► │                      │
│  PWA (Safari)    │                └──────────────────────┘
│  IndexedDB 本地   │
└──────────────────┘

静态资源托管：GitHub Pages（免费）
```

**核心思路**：
- 桌面端保持 Tauri + SQLite 不变
- 手机端通过 PWA（渐进式 Web 应用）运行，Safari 添加到主屏幕
- 两端通过 Cloudflare Worker + D1 做增量同步
- 离线可用，联网时同步

---

## 第一部分：PWA 手机版

### 1.1 为什么选 PWA

| 对比项 | PWA | Tauri Mobile (iOS) |
|--------|-----|---------------------|
| 需要 Mac | ❌ 不需要 | ✅ 必须 |
| Apple 开发者账号 | ❌ 不需要 | ✅ $99/年 |
| 安装方式 | Safari → 添加到主屏幕 | App Store 或 TestFlight |
| 开发成本 | 极低（复用现有前端） | 中等（需配置 Xcode） |
| 离线支持 | ✅ Service Worker | ✅ 原生 |
| 推送通知 | ❌ iOS 限制 | ✅ |
| 后台运行 | ❌ iOS 限制 | ✅ |

对于本项目（个人美食记录），PWA 完全够用。

### 1.2 PWA 配置清单

#### manifest.json

在 `public/` 目录下创建：

```json
{
  "name": "耗耗洞",
  "short_name": "耗耗洞",
  "description": "个人美食收藏",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#fff5f0",
  "theme_color": "#e8a87c",
  "orientation": "portrait",
  "icons": [
    { "src": "/favicon.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

#### index.html 添加 meta 标签

```html
<link rel="manifest" href="/manifest.json">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="耗耗洞">
<link rel="apple-touch-icon" href="/favicon.png">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

#### Service Worker（离线缓存）

使用 `vite-plugin-pwa` 自动生成 Service Worker：

```bash
pnpm add -D vite-plugin-pwa
```

`vite.config.ts` 中配置：

```typescript
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    // ...existing plugins
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,jpg,woff2,ttf}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/nezumihole-sync\..+\.workers\.dev/,
            handler: 'NetworkFirst',
            options: { cacheName: 'api-cache', expiration: { maxEntries: 50 } }
          }
        ]
      }
    })
  ]
});
```

### 1.3 响应式布局适配

#### 断点策略

```css
/* 桌面端（现有布局不变） */
@media (min-width: 769px) { /* 现有样式 */ }

/* 移动端 */
@media (max-width: 768px) {
  .sidebar { /* 改为底部 Tab 栏 */ }
  .main-content { /* 全宽 */ }
  .food-grid { /* 双列或单列 */ }
  .titlebar-drag-region,
  .titlebar-controls { display: none; } /* 隐藏桌面标题栏 */
}
```

#### 侧边栏 → 底部 Tab 栏

移动端将左侧 240px 侧边栏改为底部固定 Tab 栏：

```
桌面端:                          移动端:
┌────┬──────────┐               ┌──────────────┐
│侧边│  主内容   │               │   主内容      │
│栏  │          │               │   (全宽)      │
│    │          │               │              │
│    │          │               ├──────────────┤
└────┴──────────┘               │ 全部│狗粮│餐厅│…│
                                └──────────────┘
```

Tab 栏显示主要分类图标，更多分类通过"更多"按钮展开。

#### 卡片网格

```css
@media (max-width: 768px) {
  .food-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 12px;
    padding: 0 12px 80px; /* 底部留出 Tab 栏空间 */
  }
}

@media (max-width: 400px) {
  .food-grid {
    grid-template-columns: 1fr; /* 极窄屏单列 */
  }
}
```

#### 弹窗适配

移动端弹窗改为从底部滑入的全屏/半屏面板：

```css
@media (max-width: 768px) {
  .modal-content {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    max-height: 90vh;
    border-radius: 16px 16px 0 0;
    animation: slideUp 0.3s ease;
  }
}
```

### 1.4 触摸交互优化

```typescript
// 平台检测
const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
const isTauri = "__TAURI_INTERNALS__" in window;

// FoodCard 中
<motion.div
  whileHover={isMobile ? undefined : { y: -4 }}
  whileTap={{ scale: 0.97 }}
  // ...
>
```

- 移除 `whileHover`（移动端无 hover）
- 添加 `whileTap` 缩放反馈
- 增大点击目标（最小 44px × 44px，Apple HIG 要求）
- 搜索栏使用 `type="search"` 触发 iOS 搜索键盘

### 1.5 数据存储（PWA 端）

PWA 无法使用 SQLite，改用 IndexedDB：

```typescript
// src/lib/database.ts 中扩展
function getStorageBackend(): 'sqlite' | 'indexeddb' | 'memory' {
  if (isTauri) return 'sqlite';
  if (typeof indexedDB !== 'undefined') return 'indexeddb';
  return 'memory';
}
```

使用 `idb` 库（轻量 IndexedDB 封装）：

```bash
pnpm add idb
```

IndexedDB 结构与 SQLite 表一一对应，CRUD 接口保持一致。

### 1.6 部署到 GitHub Pages

```bash
# vite.config.ts 中设置 base
export default defineConfig({
  base: '/NezumiHole/',  # 对应 GitHub 仓库名
  // ...
});

# 构建
pnpm build

# 部署（可用 GitHub Actions 自动化）
# dist/ 目录内容推送到 gh-pages 分支
```

GitHub Actions 自动部署配置（`.github/workflows/deploy.yml`）：

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [master]
jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install
      - run: pnpm build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - uses: actions/deploy-pages@v4
```

部署后访问：`https://laigus.github.io/NezumiHole/`

iPhone Safari 打开 → 点击分享按钮 → "添加到主屏幕" → 完成。

---

## 第二部分：Cloudflare D1 云同步

### 2.1 Cloudflare 免费层额度

| 资源 | 免费额度 | 说明 |
|------|----------|------|
| D1 数据库 | 5 GB 总存储，最多 10 个数据库 | 个人使用完全够 |
| 行读取 | 500 万次/天 | 每日重置 |
| 行写入 | 10 万次/天 | 每日重置 |
| Workers 请求 | 10 万次/天 | API 代理调用 |
| Time Travel | 7 天 | 时间点恢复 |
| GitHub Pages | 无限 | 静态站点托管 |

**对于本项目**：138 条美食记录 + 低频增删改，免费额度基本等于无限。

### 2.2 同步架构

```
客户端（桌面/手机）                    Cloudflare
┌─────────────────┐                ┌─────────────────┐
│ 本地数据库       │                │  Worker (API)   │
│ (SQLite/IDB)    │  ── push ──►   │       │         │
│                 │                │   D1 Database   │
│ sync_log 表     │  ◄── pull ──   │                 │
│ (记录本地变更)   │                │  sync_log 表    │
│                 │                │  (全局变更日志)  │
│ last_sync_at    │                │                 │
└─────────────────┘                └─────────────────┘
```

#### 同步策略：基于变更日志的增量同步

1. **本地变更追踪**：每次本地 CRUD 操作时，在 `sync_log` 表记录变更
2. **Push**：将本地未同步的变更推送到云端
3. **Pull**：拉取云端自上次同步以来的变更，应用到本地
4. **冲突解决**：Last-Write-Wins（最后写入者胜），基于 `updatedAt` 时间戳

### 2.3 数据库变更

#### 本地新增表（SQLite 和 IndexedDB 都需要）

```sql
-- 同步元数据
CREATE TABLE IF NOT EXISTS sync_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
-- 初始值: last_sync_at = '1970-01-01T00:00:00Z', device_id = UUID

-- 本地变更日志
CREATE TABLE IF NOT EXISTS sync_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name TEXT NOT NULL,        -- 'categories' | 'food_items'
  record_id TEXT NOT NULL,         -- 被操作记录的 ID
  action TEXT NOT NULL,            -- 'INSERT' | 'UPDATE' | 'DELETE'
  data TEXT,                       -- JSON 序列化的完整记录（DELETE 时为 null）
  timestamp TEXT NOT NULL,         -- ISO 8601 UTC
  synced INTEGER DEFAULT 0         -- 0=未同步, 1=已同步
);
```

#### 云端 D1 表结构

与本地 `categories` 和 `food_items` 表结构完全一致，额外加：

```sql
-- 云端变更日志
CREATE TABLE IF NOT EXISTS cloud_sync_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  action TEXT NOT NULL,
  data TEXT,
  timestamp TEXT NOT NULL,
  device_id TEXT NOT NULL          -- 来源设备
);
```

### 2.4 Cloudflare Worker 实现

#### 项目结构

```
nezumihole-sync/              # 独立的 Cloudflare Worker 项目（在 NezumiHole 仓库外）
├── wrangler.toml             # Cloudflare 配置
├── src/
│   └── index.ts              # Worker 入口
├── schema.sql                # D1 建表语句
└── package.json
```

#### wrangler.toml

```toml
name = "nezumihole-sync"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "nezumihole"
database_id = "<创建后填入>"
```

#### API 端点设计

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/push` | 推送本地变更到云端 |
| POST | `/api/pull` | 拉取云端变更 |
| GET | `/api/full-sync` | 全量拉取（首次同步/数据恢复） |
| POST | `/api/full-push` | 全量推送（首次上传本地数据） |

```typescript
// POST /api/push
// Body: { changes: SyncLogEntry[], deviceId: string }
// Response: { applied: number }

// POST /api/pull
// Body: { since: ISO8601, deviceId: string }
// Response: { changes: CloudSyncLogEntry[] }
```

#### 认证方案

简单 Bearer Token（个人使用足够）：

```
Authorization: Bearer <你的密钥>
```

密钥存储：
- Worker 端：`wrangler secret put AUTH_TOKEN`
- 客户端：设置面板中输入，存储在 localStorage

### 2.5 客户端同步模块

新增 `src/lib/sync.ts`：

```typescript
interface SyncConfig {
  apiUrl: string;      // Cloudflare Worker URL
  authToken: string;   // Bearer Token
  deviceId: string;    // 本设备唯一 ID
}

async function sync(config: SyncConfig): Promise<SyncResult> {
  // 1. Pull: 获取云端变更（排除本设备产生的）
  const remoteChanges = await pullChanges(config);
  
  // 2. 应用远端变更到本地
  await applyRemoteChanges(remoteChanges);
  
  // 3. Push: 推送本地未同步的变更
  const localChanges = await getUnsyncedChanges();
  await pushChanges(localChanges, config);
  
  // 4. 更新同步状态
  await markAllSynced();
  await updateLastSyncTime();
}
```

### 2.6 部署步骤

```bash
# 1. 安装 Wrangler CLI
npm install -g wrangler

# 2. 登录 Cloudflare（浏览器认证）
wrangler login

# 3. 创建 D1 数据库
wrangler d1 create nezumihole
# 记下返回的 database_id，填入 wrangler.toml

# 4. 初始化表结构
wrangler d1 execute nezumihole --file=schema.sql

# 5. 设置认证密钥
wrangler secret put AUTH_TOKEN
# 输入你想要的密钥

# 6. 部署 Worker
wrangler deploy
# 返回 URL: https://nezumihole-sync.<你的子域>.workers.dev
```

### 2.7 同步 UI

在设置面板中添加：

- **同步状态**：显示上次同步时间、未同步变更数
- **手动同步按钮**：点击触发 push + pull
- **同步配置**：Worker URL + Token 输入框
- **全量同步**：首次配置或数据恢复时使用
- **自动同步**：可选，每 N 分钟自动同步

---

## 第三部分：实施路线图

### 阶段 1：PWA 基础配置（约 1 天）
1. 添加 `manifest.json` 和 meta 标签
2. 配置 `vite-plugin-pwa` + Service Worker
3. 生成 512px 图标
4. 验证 PWA 安装功能

### 阶段 2：响应式布局（约 2 天）
1. 侧边栏 → 底部 Tab 栏（移动端）
2. 卡片网格双列适配
3. 弹窗改为底部滑入面板
4. 触摸交互优化（whileTap、点击区域）
5. 隐藏桌面标题栏元素

### 阶段 3：PWA 数据层（约 1 天）
1. 添加 `idb` 依赖
2. 实现 IndexedDB 存储后端
3. `database.ts` 中根据环境自动选择 SQLite/IndexedDB/Memory
4. 验证 PWA 离线数据持久化

### 阶段 4：部署 GitHub Pages（约半天）
1. 配置 `vite.config.ts` 的 `base`
2. 创建 GitHub Actions 部署工作流
3. 推送触发自动部署
4. iPhone 测试添加到主屏幕

### 阶段 5：云同步后端（约 1-2 天）
1. 注册 Cloudflare 账号
2. 创建 Worker + D1 数据库
3. 实现 push/pull/full-sync API
4. 部署并测试

### 阶段 6：客户端同步集成（约 2 天）
1. 本地数据库添加 sync_log 和 sync_meta 表
2. CRUD 操作中插入变更日志
3. 实现 `sync.ts` 同步模块
4. 添加同步 UI（设置面板）
5. 桌面端 + PWA 联调

### 阶段 7：打磨（约 1 天）
1. 离线队列和重试机制
2. 同步冲突提示（可选）
3. iOS 安全区域适配（刘海/底部横条）
4. 更新文档

**总计预估：约 8-10 天**

---

## 注意事项

1. **时间同步**：所有时间戳使用 UTC ISO 8601，避免时区问题
2. **UUID 唯一性**：现有的 UUID 生成方式已保证全局唯一，多设备不会冲突
3. **首次同步**：第一个设备做 full-push，第二个设备做 full-sync
4. **网络错误**：同步失败不影响本地操作，下次联网时重试
5. **安全性**：Bearer Token 足够个人使用，不要泄露到公开仓库（存为 Cloudflare Secret）
6. **iOS PWA 限制**：
   - 无推送通知（不影响本项目）
   - 后台被杀后重新打开会重新加载（Service Worker 缓存保证秒开）
   - iOS 可能在存储压力下清理 IndexedDB（有云同步兜底）
7. **字体文件**：寒蝉全圆体 5.9MB TTF 在移动端首次加载较慢，建议转为 woff2 子集或移动端使用系统字体
