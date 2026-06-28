# Sync Server Deployment

This guide deploys the private NezumiHole sync service. Do not commit real server addresses, tokens, or exported data.

## Server Layout

Deploy the service under:

```bash
~/NezumiHole/sync-server
```

Runtime data is stored in:

```bash
~/NezumiHole/sync-server/data/snapshot.json
```

The `data/` directory is intentionally ignored by Git.

## Upload Files

From the repository root, copy the server folder to your host:

```bash
scp -r sync-server root@YOUR_SERVER_HOST:~/NezumiHole/
```

## Configure Runtime

Set a private sync token on the server. Keep this value out of Git.

```bash
cd ~/NezumiHole/sync-server
export HOST=127.0.0.1
export PORT=8787
export NEZUMI_SYNC_TOKEN="replace-with-a-long-random-token"
node server.js
```

The client should use the public URL exposed by your reverse proxy, for example:

```text
https://sync.example.com
```

## systemd Service

Create `/etc/systemd/system/nezumihole-sync.service`:

```ini
[Unit]
Description=NezumiHole Sync Server
After=network.target

[Service]
WorkingDirectory=/root/NezumiHole/sync-server
Environment=HOST=127.0.0.1
Environment=PORT=8787
Environment=NEZUMI_SYNC_TOKEN=replace-with-a-long-random-token
ExecStart=/usr/bin/node /root/NezumiHole/sync-server/server.js
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

Enable it:

```bash
systemctl daemon-reload
systemctl enable --now nezumihole-sync
systemctl status nezumihole-sync
```

## Reverse Proxy

Proxy HTTPS traffic to `http://127.0.0.1:8787`. The server exposes:

```text
GET  /health
GET  /api/snapshot
POST /api/sync
```

## Sync Safety

Each server snapshot has a monotonically increasing `revision`. Clients must upload with the current `baseRevision`; stale uploads receive `409 revision_conflict`. The client then merges records by `updatedAt` and applies tombstones for deletions before retrying, so older clients cannot blindly overwrite newer server data.

## How Sync Works

The desktop app stores normal records locally in SQLite and stores sync settings only on the local machine. The server address and sync token are saved in browser `localStorage`, not in the repository.

When the user clicks sync, the client:

1. Exports the current local snapshot: `categories`, `foods`, and `tombstones`.
2. Calls `GET /api/snapshot` to read the server snapshot and its current `revision`.
3. Merges local and server snapshots in the client.
4. Calls `POST /api/sync` with `{ baseRevision, data }`.
5. Imports the merged snapshot back into local SQLite after the server accepts it.

The server only stores one canonical snapshot file. It does not decide field-level conflicts; it enforces revision safety. If the posted `baseRevision` does not equal the server's current `revision`, the server returns `409 revision_conflict` with the latest server data. The client then merges again and retries once using the newer revision.

## Newer Data Rules

Food records use `updatedAt`; category records also carry `updatedAt` for sync. During merge, records are grouped by `id`. If the same `id` exists on both sides, the record with the later `updatedAt` wins.

Deletes are represented by tombstones:

```json
{ "entityType": "food", "id": "...", "deletedAt": "2026-06-28T12:00:00.000Z" }
```

A tombstone wins over a record when `deletedAt >= updatedAt`. This prevents an older client that still has a deleted item from re-uploading it and resurrecting it. If a record is recreated or edited after the tombstone time, the newer record wins and the item remains.

The important protection is two-layered:

- `revision` prevents stale clients from overwriting a newer server snapshot.
- `updatedAt` and tombstones decide which individual records survive after the client merges snapshots.
