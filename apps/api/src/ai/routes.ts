import { Router } from "express";
import {
  getGroqClient,
  GROQ_MODEL,
} from "./groq.js";
import {
  addMessage,
  createSession,
  deleteSession,
  getSession,
  listSessions,
} from "./storage.js";

export const aiRouter = Router();

function getClientId(req: any) {
  const value = String(req.headers["x-nexus-client-id"] ?? "").trim();

  if (!value || value.length > 128) {
    return null;
  }

  return value;
}

aiRouter.get("/sessions", (req, res) => {
  const clientId = getClientId(req);

  if (!clientId) {
    return res.status(400).json({
      ok: false,
      error: "Client ID is required",
    });
  }

  return res.json({
    ok: true,
    sessions: listSessions(clientId),
  });
});

aiRouter.post("/sessions", (req, res) => {
  const clientId = getClientId(req);

  if (!clientId) {
    return res.status(400).json({
      ok: false,
      error: "Client ID is required",
    });
  }

  const title =
    typeof req.body?.title === "string"
      ? req.body.title.trim()
      : "New conversation";

  const session = createSession(
    clientId,
    title || "New conversation",
  );

  return res.status(201).json({
    ok: true,
    session,
  });
});

aiRouter.get("/sessions/:sessionId", (req, res) => {
  const clientId = getClientId(req);

  if (!clientId) {
    return res.status(400).json({
      ok: false,
      error: "Client ID is required",
    });
  }

  const session = getSession(
    clientId,
    req.params.sessionId,
  );

  if (!session) {
    return res.status(404).json({
      ok: false,
      error: "Session not found",
    });
  }

  return res.json({
    ok: true,
    session,
  });
});

aiRouter.delete("/sessions/:sessionId", (req, res) => {
  const clientId = getClientId(req);

  if (!clientId) {
    return res.status(400).json({
      ok: false,
      error: "Client ID is required",
    });
  }

  const deleted = deleteSession(
    clientId,
    req.params.sessionId,
  );

  if (!deleted) {
    return res.status(404).json({
      ok: false,
      error: "Session not found",
    });
  }

  return res.json({
    ok: true,
  });
});

aiRouter.post("/chat", async (req, res) => {
  try {
    const clientId = getClientId(req);

    if (!clientId) {
      return res.status(400).json({
        ok: false,
        error: "Client ID is required",
      });
    }

    const message = String(
      req.body?.message ?? "",
    ).trim();

    const sessionId = String(
      req.body?.sessionId ?? "",
    ).trim();

    if (!message) {
      return res.status(400).json({
        ok: false,
        error: "Message is required",
      });
    }

    if (!sessionId) {
      return res.status(400).json({
        ok: false,
        error: "Session ID is required",
      });
    }

    let session = getSession(
      clientId,
      sessionId,
    );

    if (!session) {
      return res.status(404).json({
        ok: false,
        error: "Session not found",
      });
    }

    session = addMessage(
      clientId,
      sessionId,
      "user",
      message,
    )!;

    const groq = getGroqClient();

    const messages = [
      {
        role: "system" as const,
        content:
          "You are NΞXUS XS AI, a helpful developer assistant. Help users plan projects, understand code, and solve programming problems clearly. Continue the current conversation naturally and use the previous messages in this session as context.",
      },
      ...session.messages.map((item) => ({
        role: item.role,
        content: item.text,
      })),
    ];

    const completion =
      await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages,
      });

    const reply =
      completion.choices[0]?.message?.content ?? "";

    const updatedSession = addMessage(
      clientId,
      sessionId,
      "assistant",
      reply || "لم يصل رد من النموذج.",
    );

    return res.json({
      ok: true,
      model: GROQ_MODEL,
      reply: reply || "لم يصل رد من النموذج.",
      session: updatedSession,
    });
  } catch (error) {
    console.error("NΞXUS XS AI error:", error);

    return res.status(500).json({
      ok: false,
      error: "AI request failed",
    });
  }
});
