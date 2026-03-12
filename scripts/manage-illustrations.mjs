#!/usr/bin/env node
/**
 * 动态插画管理脚本
 *
 * 用法:
 *   pnpm illustrations                       — 从暂存目录添加新图片并同步计数
 *   pnpm illustrations --sync                — 仅同步 FOOD_ILLUSTRATION_COUNT（不处理新图片）
 *   pnpm illustrations --add <path>          — 从指定路径添加图片
 *   pnpm illustrations --delete 15           — 删除 food-15.png 并重新编号
 *   pnpm illustrations --delete 10,15,20     — 批量删除多张并重新编号
 *   pnpm illustrations --reindex             — 重新编号所有图片（填补间隔）
 *   pnpm illustrations --width 400           — 指定压缩宽度（默认 400px）
 */

import { readdir, stat, readFile, writeFile, unlink, rename, mkdir } from "node:fs/promises";
import { join, extname, resolve } from "node:path";
import { existsSync } from "node:fs";
import sharp from "sharp";

const ROOT = resolve(import.meta.dirname, "..");
const ILLUST_DIR = join(ROOT, "public", "food-illustrations");
const STAGING_DIR = join(ROOT, "素材", "new-illustrations");
const TYPES_FILE = join(ROOT, "src", "types", "index.ts");
const SUPPORTED_EXTS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif", ".tiff"]);
const DEFAULT_WIDTH = 400;

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { sync: false, addPath: null, width: DEFAULT_WIDTH, deleteNums: null, reindex: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--sync") opts.sync = true;
    else if (args[i] === "--reindex") opts.reindex = true;
    else if (args[i] === "--add" && args[i + 1]) opts.addPath = args[++i];
    else if (args[i] === "--delete" && args[i + 1]) {
      opts.deleteNums = args[++i].split(",").map((n) => parseInt(n.trim(), 10)).filter((n) => n > 0);
    }
    else if (args[i] === "--width" && args[i + 1]) opts.width = parseInt(args[++i], 10);
  }
  return opts;
}

async function getExistingFiles() {
  if (!existsSync(ILLUST_DIR)) return [];
  const files = await readdir(ILLUST_DIR);
  return files
    .filter((f) => /^food-(\d+)\.png$/.test(f))
    .map((f) => ({
      name: f,
      num: parseInt(f.match(/^food-(\d+)\.png$/)[1], 10),
      path: join(ILLUST_DIR, f),
    }))
    .sort((a, b) => a.num - b.num);
}

async function getExistingCount() {
  const files = await getExistingFiles();
  return files.length;
}

async function updateTypeCount(count) {
  const content = await readFile(TYPES_FILE, "utf-8");
  const updated = content.replace(
    /export const FOOD_ILLUSTRATION_COUNT = \d+;/,
    `export const FOOD_ILLUSTRATION_COUNT = ${count};`
  );
  if (updated !== content) {
    await writeFile(TYPES_FILE, updated, "utf-8");
    console.log(`✓ FOOD_ILLUSTRATION_COUNT 更新为 ${count}`);
    return true;
  }
  console.log(`  FOOD_ILLUSTRATION_COUNT 已是 ${count}，无需更新`);
  return false;
}

async function reindexFiles() {
  const files = await getExistingFiles();
  let renamed = 0;
  for (let i = 0; i < files.length; i++) {
    const expected = i + 1;
    if (files[i].num !== expected) {
      const newPath = join(ILLUST_DIR, `food-${expected}.png`);
      await rename(files[i].path, newPath);
      console.log(`  ${files[i].name} → food-${expected}.png`);
      files[i].path = newPath;
      files[i].num = expected;
      renamed++;
    }
  }
  return { total: files.length, renamed };
}

async function getImageFiles(dir) {
  if (!existsSync(dir)) return [];
  const entries = await readdir(dir);
  const images = [];
  for (const entry of entries) {
    const ext = extname(entry).toLowerCase();
    if (!SUPPORTED_EXTS.has(ext)) continue;
    const fullPath = join(dir, entry);
    const s = await stat(fullPath);
    if (s.isFile()) images.push(fullPath);
  }
  return images.sort();
}

async function processImage(inputPath, outputPath, width) {
  await sharp(inputPath)
    .resize({ width, withoutEnlargement: true })
    .png({ quality: 85, compressionLevel: 9 })
    .toFile(outputPath);
  const info = await stat(outputPath);
  return info.size;
}

async function handleDelete(nums) {
  const files = await getExistingFiles();
  const fileMap = new Map(files.map((f) => [f.num, f]));

  let deleted = 0;
  for (const n of nums) {
    const f = fileMap.get(n);
    if (f) {
      await unlink(f.path);
      console.log(`  ✓ 已删除 ${f.name}`);
      deleted++;
    } else {
      console.log(`  ✗ food-${n}.png 不存在，跳过`);
    }
  }

  if (deleted > 0) {
    console.log(`\n  正在重新编号...`);
    const { total, renamed } = await reindexFiles();
    console.log(`  重新编号完成（${renamed} 个文件重命名）\n`);
    await updateTypeCount(total);
  }

  return deleted;
}

async function main() {
  const opts = parseArgs();
  console.log("🖼️  耗耗洞 · 插画管理工具\n");

  const existingCount = await getExistingCount();
  console.log(`  当前插画数量: ${existingCount}`);

  if (opts.deleteNums) {
    console.log(`\n  删除: ${opts.deleteNums.map((n) => `food-${n}.png`).join(", ")}\n`);
    await handleDelete(opts.deleteNums);
    return;
  }

  if (opts.reindex) {
    console.log(`\n  正在重新编号...`);
    const { total, renamed } = await reindexFiles();
    if (renamed > 0) {
      console.log(`  重新编号完成（${renamed} 个文件重命名）\n`);
    } else {
      console.log(`  编号已连续，无需调整\n`);
    }
    await updateTypeCount(total);
    return;
  }

  if (opts.sync) {
    await updateTypeCount(existingCount);
    return;
  }

  const sourceDir = opts.addPath ? resolve(opts.addPath) : STAGING_DIR;
  console.log(`  暂存目录: ${sourceDir}`);

  if (!existsSync(sourceDir)) {
    await mkdir(sourceDir, { recursive: true });
    console.log(`\n  已创建暂存目录，请将新图片放入该目录后重新运行。`);
    await updateTypeCount(existingCount);
    return;
  }

  const newImages = await getImageFiles(sourceDir);
  if (newImages.length === 0) {
    console.log(`\n  暂存目录中没有新图片。`);
    await updateTypeCount(existingCount);
    return;
  }

  console.log(`  发现 ${newImages.length} 张新图片\n`);

  if (!existsSync(ILLUST_DIR)) {
    await mkdir(ILLUST_DIR, { recursive: true });
  }

  let nextIndex = existingCount + 1;
  let totalSize = 0;

  for (const imgPath of newImages) {
    const outputName = `food-${nextIndex}.png`;
    const outputPath = join(ILLUST_DIR, outputName);

    try {
      const size = await processImage(imgPath, outputPath, opts.width);
      totalSize += size;
      const sizeKB = (size / 1024).toFixed(1);
      console.log(`  ✓ ${outputName} (${sizeKB} KB) ← ${imgPath.split(/[/\\]/).pop()}`);
      await unlink(imgPath);
      nextIndex++;
    } catch (err) {
      console.error(`  ✗ 处理失败: ${imgPath.split(/[/\\]/).pop()} — ${err.message}`);
    }
  }

  const newCount = nextIndex - 1;
  const added = newCount - existingCount;
  const totalKB = (totalSize / 1024).toFixed(1);

  console.log(`\n  新增 ${added} 张插画，总大小 ${totalKB} KB`);
  console.log(`  插画总数: ${existingCount} → ${newCount}\n`);

  await updateTypeCount(newCount);
}

main().catch((err) => {
  console.error("脚本执行失败:", err);
  process.exit(1);
});
