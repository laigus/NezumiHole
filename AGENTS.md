# Repository Guidelines

## Project Structure & Module Organization

NezumiHole is a Tauri 2 desktop app with a React 19, TypeScript, and Vite frontend. Frontend code lives in `src/`: reusable UI is under `src/components/`, hooks in `src/hooks/`, shared data in `src/data/`, persistence helpers in `src/lib/`, global state in `src/store/`, theme files in `src/themes/`, and shared types in `src/types/`. Static images, fonts, and app-facing assets live in `public/`, including `public/food-illustrations/` and `public/card-backgrounds/`. Tauri/Rust code and packaging configuration live in `src-tauri/`. Utility scripts are in `scripts/`; source art and work-in-progress assets are kept in `素材/`.

## Build, Test, and Development Commands

Use `pnpm install` to install dependencies from `pnpm-lock.yaml`. Run `pnpm dev` for the Vite-only development server on port `1420`. Run `pnpm tauri dev` to start the desktop app with hot reload. Run `pnpm build` to type-check with `tsc` and build the frontend. Run `pnpm tauri build` to package the desktop application. Use `pnpm preview` to preview the built frontend, and `pnpm illustrations` to process new food illustration assets.

## Coding Style & Naming Conventions

Use TypeScript, React function components, and hooks. Follow the existing two-space indentation, double-quoted imports, semicolons, and trailing commas in multiline calls. Import local modules through the `@/` alias when possible. Name React components in `PascalCase` (`FoodCard.tsx`), hooks as `useName.ts`, and shared data files with descriptive kebab-case names. Keep theme-specific styling in `src/themes/` or clearly grouped sections of `src/styles.css`.

## Testing Guidelines

No automated test runner is configured yet. Before submitting changes, run `pnpm build` and, for desktop or database changes, also run `pnpm tauri dev` for a manual smoke test. If adding tests later, prefer colocated `*.test.ts` or `*.test.tsx` files and document the new command in `package.json`.

## Commit & Pull Request Guidelines

Recent history uses Conventional Commits, such as `feat: ...`, `fix: ...`, and `docs: ...`; keep that pattern and write concise, imperative subjects. Pull requests should describe the user-visible change, list verification steps, link related issues when available, and include screenshots or short recordings for UI changes. Note any asset-processing steps, database migrations, or Tauri packaging implications.

## Security & Configuration Tips

Do not commit local databases, generated build output, or machine-specific configuration. The app database is stored under `%APPDATA%/com.tssh.nezumi-hole/nezumihole.db` in desktop mode. Keep large raw art files in `素材/` only when they are intentionally part of the repository; optimized runtime assets belong in `public/`.
