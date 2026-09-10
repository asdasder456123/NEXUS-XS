import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import path from "node:path";
import dotenv from "dotenv";

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);
const projectRoot = path.resolve(currentDirectory, "../../..");

dotenv.config({
  path: path.join(projectRoot, ".env"),
});

import cors from "cors";
import express from "express";

import { aiRouter } from "./ai/routes.js";
import { minecraftBotRouter } from "./minecraft-bot/routes.js";
import { startDiscordNewsBot } from "./discord-bot/index.js";
import { newsRouter } from "./news/routes.js";
import { resourcePacksRouter } from "./resource-packs/routes.js";
import { chatRouter } from "./chat/routes.js";
import { attachChatWebSocket } from "./chat/ws.js";
import {
  startPublicTunnel,
  stopPublicTunnel,
} from "./public-tunnel/index.js";

const app = express();
const port = Number(process.env.PORT ?? 3000);
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(express.json());
/*
 * API routes
 */
app.use("/api/ai", aiRouter);
app.use("/api/minecraft-bot", minecraftBotRouter);
app.use("/api/news", newsRouter);
app.use("/api/resource-packs", resourcePacksRouter);
app.use("/api/chat", chatRouter);

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    name: "NΞXUS XS",
    version: "0.1.0",
  });
});

/*
 * Production web frontend.
 *
 * Works both from:
 *   apps/api/src/index.ts
 * and:
 *   apps/api/dist/index.js
 */
const webDistPath = path.resolve(
  currentDirectory,
  "../../web/dist",
);

app.use(express.static(webDistPath));

/*
 * SPA fallback.
 *
 * API/auth routes are left untouched.
 */
app.use((req, res, next) => {
  if (
    req.method === "GET" &&
    !req.path.startsWith("/api/") &&
    !req.path.startsWith("/auth")
  ) {
    res.sendFile(path.join(webDistPath, "index.html"), (error) => {
      if (error) {
        next(error);
      }
    });

    return;
  }

  next();
});

const server = createServer(app);

attachChatWebSocket(server);

server.listen(port, "127.0.0.1", () => {
  console.log(
    `NΞXUS XS production server running on http://127.0.0.1:${port}`,
  );
});

startDiscordNewsBot();

void startPublicTunnel();

function shutdown(signal: string) {
  console.log(`[NΞXUS XS] Received ${signal}. Shutting down...`);

  stopPublicTunnel();

  server.close(() => {
    console.log("[NΞXUS XS] Server stopped.");
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
