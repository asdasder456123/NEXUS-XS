import { createServer } from "node:http";
import dotenv from "dotenv";
import path from "node:path";

// Load the project-root .env explicitly when running from apps/api.
dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });
import cors from "cors";
import express from "express";
import session from "express-session";
import { authRouter } from "./auth/routes.js";
import { aiRouter } from "./ai/routes.js";
import { minecraftBotRouter } from "./minecraft-bot/routes.js";
import { startDiscordNewsBot } from "./discord-bot/index.js";
import { newsRouter } from "./news/routes.js";
import { chatRouter } from "./chat/routes.js";
import { attachChatWebSocket } from "./chat/ws.js";
import { startPublicTunnel, stopPublicTunnel } from "./public-tunnel/index.js";

const app = express();
const port = Number(process.env.PORT ?? 3000);

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is missing");
}

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  }),
);

app.use("/auth", authRouter);
app.use("/api/ai", aiRouter);
app.use("/api/minecraft-bot", minecraftBotRouter);
app.use("/api/news", newsRouter);
app.use("/api/chat", chatRouter);


app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    name: "NΞXUS XS",
    version: "0.1.0",
  });
});

startDiscordNewsBot();

void startPublicTunnel();

process.on("SIGINT", () => {
  stopPublicTunnel();
});

process.on("SIGTERM", () => {
  stopPublicTunnel();
});

const server = createServer(app);

attachChatWebSocket(server);

server.listen(port, () => {
  console.log(`NΞXUS XS API running on http://127.0.0.1:${port}`);
});
