import type { AppDataSnapshot, Category, FoodItem, SyncTombstone } from "@/types";

export interface SyncConfig {
  serverUrl: string;
  token: string;
  lastRevision: number;
}

export interface SyncResult {
  revision: number;
  snapshot: AppDataSnapshot;
  message: string;
}

interface ServerSnapshot {
  revision: number;
  updatedAt: string | null;
  data: AppDataSnapshot | null;
}

interface PushResponse {
  revision: number;
  updatedAt: string;
}

interface ConflictResponse extends ServerSnapshot {
  error: string;
}

const SYNC_CONFIG_KEY = "nezumihole.sync.config";

export function loadSyncConfig(): SyncConfig {
  try {
    const raw = localStorage.getItem(SYNC_CONFIG_KEY);
    if (!raw) return { serverUrl: "", token: "", lastRevision: 0 };
    return { serverUrl: "", token: "", lastRevision: 0, ...JSON.parse(raw) };
  } catch {
    return { serverUrl: "", token: "", lastRevision: 0 };
  }
}

export function saveSyncConfig(config: SyncConfig) {
  localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(config));
}

export function normalizeServerUrl(url: string) {
  const trimmed = url.trim();
  const explicitUrl = trimmed.match(/https?:\/\/[^\s]+/i)?.[0];
  const firstToken = explicitUrl || trimmed.split(/\s+/)[0] || "";
  if (!firstToken) return "";
  const withProtocol = /^https?:\/\//i.test(firstToken) ? firstToken : `http://${firstToken}`;
  return withProtocol.replace(/\/+$/, "");
}

function authHeaders(token: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token.trim()) headers.Authorization = `Bearer ${token.trim()}`;
  return headers;
}

function newerTime(a?: string | null, b?: string | null) {
  return (a || "") >= (b || "") ? a || "" : b || "";
}

function normalizeSnapshot(snapshot: AppDataSnapshot): AppDataSnapshot {
  return {
    schemaVersion: 2,
    categories: (snapshot.categories || []).map((cat) => ({
      ...cat,
      updatedAt: cat.updatedAt || "1970-01-01T00:00:00.000Z",
    })),
    foods: snapshot.foods || [],
    tombstones: snapshot.tombstones || [],
  };
}

function mergeTombstones(...groups: SyncTombstone[][]) {
  const byKey = new Map<string, SyncTombstone>();
  for (const tombstone of groups.flat()) {
    const key = `${tombstone.entityType}:${tombstone.id}`;
    const current = byKey.get(key);
    if (!current || tombstone.deletedAt > current.deletedAt) {
      byKey.set(key, tombstone);
    }
  }
  return [...byKey.values()];
}

function pickLatestCategory(a: Category | undefined, b: Category) {
  if (!a) return b;
  return newerTime(a.updatedAt, b.updatedAt) === a.updatedAt ? a : b;
}

function pickLatestFood(a: FoodItem | undefined, b: FoodItem) {
  if (!a) return b;
  return newerTime(a.updatedAt, b.updatedAt) === a.updatedAt ? a : b;
}

export function mergeSnapshots(local: AppDataSnapshot, remote: AppDataSnapshot): AppDataSnapshot {
  const left = normalizeSnapshot(local);
  const right = normalizeSnapshot(remote);
  const tombstones = mergeTombstones(left.tombstones || [], right.tombstones || []);
  const tombstoneByKey = new Map(tombstones.map((t) => [`${t.entityType}:${t.id}`, t]));

  const categories = new Map<string, Category>();
  for (const category of [...right.categories, ...left.categories]) {
    categories.set(category.id, pickLatestCategory(categories.get(category.id), category));
  }

  const foods = new Map<string, FoodItem>();
  for (const food of [...right.foods, ...left.foods]) {
    foods.set(food.id, pickLatestFood(foods.get(food.id), food));
  }

  for (const [id, category] of categories) {
    const tombstone = tombstoneByKey.get(`category:${id}`);
    if (tombstone && tombstone.deletedAt >= (category.updatedAt || "")) {
      categories.delete(id);
    }
  }

  for (const [id, food] of foods) {
    const tombstone = tombstoneByKey.get(`food:${id}`);
    if (tombstone && tombstone.deletedAt >= food.updatedAt) {
      foods.delete(id);
    }
  }

  return {
    schemaVersion: 2,
    categories: [...categories.values()].sort((a, b) => a.sortOrder - b.sortOrder),
    foods: [...foods.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    tombstones,
  };
}

async function readServerSnapshot(config: SyncConfig): Promise<ServerSnapshot> {
  const response = await requestSyncEndpoint(`${normalizeServerUrl(config.serverUrl)}/api/snapshot`, {
    headers: authHeaders(config.token),
  });
  if (!response.ok) throw new Error(`读取服务器失败：${response.status}`);
  return response.json();
}

async function pushSnapshot(config: SyncConfig, baseRevision: number, data: AppDataSnapshot) {
  const response = await requestSyncEndpoint(`${normalizeServerUrl(config.serverUrl)}/api/sync`, {
    method: "POST",
    headers: authHeaders(config.token),
    body: JSON.stringify({ baseRevision, data }),
  });

  if (response.status === 409) {
    const conflict = (await response.json()) as ConflictResponse;
    return { conflict };
  }

  if (!response.ok) throw new Error(`上传服务器失败：${response.status}`);
  return { pushed: (await response.json()) as PushResponse };
}

async function requestSyncEndpoint(url: string, init: RequestInit) {
  try {
    return await fetch(url, init);
  } catch (err) {
    const originalMessage = err instanceof Error ? err.message : String(err);
    throw new Error(
      `无法连接同步服务器：请检查服务器地址、端口和服务状态。地址可以填写 IP:端口 或 http://IP:端口。原始错误：${originalMessage}`,
    );
  }
}

export async function syncWithServer(config: SyncConfig, local: AppDataSnapshot): Promise<SyncResult> {
  if (!normalizeServerUrl(config.serverUrl)) {
    throw new Error("请先填写服务器地址");
  }

  const server = await readServerSnapshot(config);
  const localSnapshot = normalizeSnapshot(local);
  const merged = server.data ? mergeSnapshots(localSnapshot, server.data) : localSnapshot;
  const pushed = await pushSnapshot(config, server.revision, merged);

  if (pushed.conflict) {
    const conflictSnapshot = pushed.conflict.data
      ? mergeSnapshots(merged, pushed.conflict.data)
      : merged;
    const retry = await pushSnapshot(config, pushed.conflict.revision, conflictSnapshot);
    if (retry.conflict) throw new Error("服务器数据仍在变化，请稍后重试");
    return {
      revision: retry.pushed!.revision,
      snapshot: conflictSnapshot,
      message: "同步完成：已处理服务器上的新版本",
    };
  }

  return {
    revision: pushed.pushed!.revision,
    snapshot: merged,
    message: server.data ? "同步完成：本地和服务器已合并" : "同步完成：已初始化服务器数据",
  };
}
