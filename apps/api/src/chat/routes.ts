import { Router } from "express";
import { getChatMessages } from "./storage.js";

export const chatRouter = Router();

chatRouter.get("/messages", async (_req, res) => {
  try {
    res.json({
      ok: true,
      messages: await getChatMessages(),
    });
  } catch (error) {
    console.error("[Chat] Failed to load messages:", error);

    res.status(500).json({
      ok: false,
      error: "Failed to load chat messages",
    });
  }
});
