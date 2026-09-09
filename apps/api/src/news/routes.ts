import { Router } from "express";
import { addNews, getNews } from "./storage.js";

export const newsRouter = Router();

newsRouter.get("/", async (_req, res) => {
  try {
    res.json({
      ok: true,
      items: await getNews(),
    });
  } catch (error) {
    console.error("[News] Failed to load news:", error);
    res.status(500).json({
      ok: false,
      error: "Failed to load news",
    });
  }
});

newsRouter.post("/", async (req, res) => {
  try {
    const { title, description, url, image, source, author } =
      req.body ?? {};

    if (
      typeof title !== "string" ||
      typeof description !== "string" ||
      typeof url !== "string" ||
      !title.trim() ||
      !url.trim()
    ) {
      return res.status(400).json({
        ok: false,
        error: "title, description and url are required",
      });
    }

    const item = await addNews({
      title: title.trim(),
      description: description.trim(),
      url: url.trim(),
      image:
        typeof image === "string" && image.trim()
          ? image.trim()
          : undefined,
      source:
        typeof source === "string" && source.trim()
          ? source.trim()
          : undefined,
      author:
        typeof author === "string" && author.trim()
          ? author.trim()
          : undefined,
    });

    res.status(201).json({
      ok: true,
      item,
    });
  } catch (error) {
    console.error("[News] Failed to create news:", error);
    res.status(500).json({
      ok: false,
      error: "Failed to create news",
    });
  }
});
