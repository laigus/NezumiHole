import { createServer } from "node:http";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || "127.0.0.1";
const SYNC_TOKEN = process.env.NEZUMI_SYNC_TOKEN || "";
const DATA_DIR = process.env.NEZUMI_SYNC_DATA_DIR || path.join(__dirname, "data");
const STORE_FILE = path.join(DATA_DIR, "snapshot.json");

async function readStore() {
  try {
    const raw = await readFile(STORE_FILE, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === "ENOENT") {
      return { revision: 0, updatedAt: null, data: null };
    }
    throw err;
  }
}

async function writeStore(store) {
  await mkdir(DATA_DIR, { recursive: true });
  const tmp = `${STORE_FILE}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(store, null, 2), "utf8");
  await rename(tmp, STORE_FILE);
}

function sendJson(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
  });
  res.end(JSON.stringify(body));
}

function isAuthorized(req) {
  if (!SYNC_TOKEN) return true;
  const header = req.headers.authorization || "";
  return header === `Bearer ${SYNC_TOKEN}`;
}

async function readRequestJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function validateSnapshot(data) {
  if (!data || typeof data !== "object") return "data must be an object";
  if (!Array.isArray(data.categories)) return "data.categories must be an array";
  if (!Array.isArray(data.foods)) return "data.foods must be an array";
  if (data.tombstones !== undefined && !Array.isArray(data.tombstones)) {
    return "data.tombstones must be an array";
  }
  return null;
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === "OPTIONS") return sendJson(res, 204, {});
    if (!isAuthorized(req)) return sendJson(res, 401, { error: "unauthorized" });

    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

    if (req.method === "GET" && url.pathname === "/health") {
      return sendJson(res, 200, { ok: true });
    }

    if (req.method === "GET" && url.pathname === "/api/snapshot") {
      return sendJson(res, 200, await readStore());
    }

    if (req.method === "POST" && url.pathname === "/api/sync") {
      const body = await readRequestJson(req);
      const store = await readStore();

      if (!Number.isInteger(body.baseRevision)) {
        return sendJson(res, 400, { error: "baseRevision must be an integer" });
      }

      const validationError = validateSnapshot(body.data);
      if (validationError) return sendJson(res, 400, { error: validationError });

      if (body.baseRevision !== store.revision) {
        return sendJson(res, 409, {
          error: "revision_conflict",
          revision: store.revision,
          updatedAt: store.updatedAt,
          data: store.data,
        });
      }

      const next = {
        revision: store.revision + 1,
        updatedAt: new Date().toISOString(),
        data: { schemaVersion: 2, tombstones: [], ...body.data },
      };
      await writeStore(next);
      return sendJson(res, 200, { revision: next.revision, updatedAt: next.updatedAt });
    }

    return sendJson(res, 404, { error: "not_found" });
  } catch (err) {
    console.error(err);
    return sendJson(res, 500, { error: "internal_error" });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`NezumiHole sync server listening on http://${HOST}:${PORT}`);
});
