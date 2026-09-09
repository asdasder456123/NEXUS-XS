import type { Server as HttpServer } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import { addChatMessage } from "./storage.js";

type ChatUser = {
  id: string;
  username: string;
  avatar?: string;
};

type IncomingMessage = {
  type: "message";
  text: string;
  user?: ChatUser;
};

const clients = new Set<WebSocket>();

function broadcast(payload: unknown) {
  const data = JSON.stringify(payload);

  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
}

function normalizeUser(user?: ChatUser): ChatUser {
  if (
    user &&
    typeof user.id === "string" &&
    typeof user.username === "string" &&
    user.id.trim() &&
    user.username.trim()
  ) {
    return {
      id: user.id.trim(),
      username: user.username.trim().slice(0, 80),
      avatar:
        typeof user.avatar === "string" && user.avatar.trim()
          ? user.avatar.trim()
          : undefined,
    };
  }

  return {
    id: "guest",
    username: "Guest",
  };
}

export function attachChatWebSocket(server: HttpServer) {
  const wss = new WebSocketServer({
    server,
    path: "/ws/chat",
  });

  wss.on("connection", (socket) => {
    clients.add(socket);

    socket.send(
      JSON.stringify({
        type: "connected",
      }),
    );

    socket.on("message", async (raw) => {
      try {
        const data = JSON.parse(raw.toString()) as IncomingMessage;

        if (data.type !== "message") return;
        if (typeof data.text !== "string") return;

        const text = data.text.trim();

        if (!text || text.length > 2000) {
          return;
        }

        const user = normalizeUser(data.user);

        const message = await addChatMessage({
          authorId: user.id,
          author: user.username,
          avatar: user.avatar,
          text,
        });

        broadcast({
          type: "message",
          message,
        });
      } catch (error) {
        console.error("[Chat] WebSocket message error:", error);

        if (socket.readyState === WebSocket.OPEN) {
          socket.send(
            JSON.stringify({
              type: "error",
              error: "تعذر إرسال الرسالة.",
            }),
          );
        }
      }
    });

    socket.on("close", () => {
      clients.delete(socket);
    });

    socket.on("error", () => {
      clients.delete(socket);
    });
  });

  console.log("[Chat] WebSocket ready on /ws/chat");

  return wss;
}
