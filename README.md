# 耗耗洞 NezumiHole

> 像小老鼠一样，把所有好吃好喝的都囤进洞里。

个人美食收藏桌面应用，帮你整理买过的好吃好喝的东西，方便以后想吃时快速找到。

**技术栈**: Tauri 2 (Rust) + React 19 + TypeScript + Vite 7

## 环境要求

- Node.js >= 18
- pnpm >= 8
- Rust (rustup)
- Visual Studio Build Tools 2022（含 C++ 桌面开发工作负载）

> 详细的环境配置步骤和国内镜像配置见 `.cursor/rules/PROJECT.md`。

## 常用命令

```bash
pnpm install            # 安装依赖
pnpm dev                # 仅前端开发服务器 (localhost:1420)
pnpm tauri dev          # 启动桌面应用开发模式（含热重载）
pnpm tauri build        # 打包为 exe 安装包
```

> **PowerShell 执行策略**：若提示"禁止运行脚本"，在终端运行：
> `Set-ExecutionPolicy Bypass -Scope Process`

## 插画管理

食物插画存放在 `public/food-illustrations/`，卡片背景存放在 `public/card-backgrounds/`。

### 添加新食物插画

```bash
# 方法一：使用插画管理脚本
# 将新图片放入 素材/new-illustrations/ 后运行：
pnpm illustrations

# 方法二：使用 Skill 脚本（更灵活）
python .cursor/skills/process-image-assets/scripts/compress_images.py "素材/食物*.png" public/food-illustrations/food 400
python .cursor/skills/process-image-assets/scripts/deploy_assets.py
```

### 拆分合并图

```bash
# 将一张 4x3 网格图拆分为 12 张单独图片
python .cursor/skills/process-image-assets/scripts/split_grid.py "素材/cards.png" public/card-backgrounds/card 4 3
python .cursor/skills/process-image-assets/scripts/deploy_assets.py
```

### 管理脚本参考

| 命令 | 说明 |
|------|------|
| `pnpm illustrations` | 处理新插画（压缩→重命名→更新计数） |
| `pnpm illustrations --sync` | 仅同步计数 |
| `pnpm illustrations --delete 15` | 删除 food-15.png 并重新编号 |
| `pnpm illustrations --reindex` | 重新编号所有图片 |
| `deploy_assets.py` | 自动更新 TypeScript 常量 |

## 打包部署

```bash
pnpm tauri build
```

产物位于 `src-tauri/target/release/bundle/`：

| 格式 | 文件 | 大小 |
|------|------|------|
| NSIS (推荐) | `nsis/NezumiHole_*_x64-setup.exe` | ~3 MB |
| MSI | `msi/NezumiHole_*_x64_en-US.msi` | ~4.4 MB |

> 打包需要 VS Build Tools 2022。首次打包会下载 WiX Toolset，可设置 `TAURI_BUNDLER_TOOLS_GITHUB_MIRROR=https://ghfast.top` 加速。

## 数据管理

- 数据库位置：`%APPDATA%/com.tssh.nezumi-hole/nezumihole.db`
- 清空数据重来：删除上述 db 文件，重启应用即可
- 支持 JSON 格式导入/导出（应用内设置页面操作）
