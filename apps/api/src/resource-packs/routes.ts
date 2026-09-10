import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { Router } from "express";
import multer from "multer";

import {
  addResourcePack,
  getResourcePacks,
  getResourcePackFilesDirectory,
} from "./storage.js";

const resourcePacksRouter = Router();

const MAX_PACK_SIZE = 100 * 1024 * 1024;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const allowedImageExtensions = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 2,
    fileSize: MAX_PACK_SIZE,
  },

  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();

    if (file.fieldname === "pack") {
      if (extension !== ".zip") {
        callback(
          new Error("Resource Pack must be a ZIP file."),
        );
        return;
      }

      callback(null, true);
      return;
    }

    if (file.fieldname === "image") {
      if (!allowedImageExtensions.has(extension)) {
        callback(
          new Error("Unsupported image format."),
        );
        return;
      }

      callback(null, true);
      return;
    }

    callback(new Error("Unexpected upload field."));
  },
});

function safeText(value: unknown, maxLength: number): string {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, maxLength);
}

function getExtension(filename: string): string {
  return path.extname(filename).toLowerCase();
}

function isZipBuffer(buffer: Buffer): boolean {
  if (buffer.length < 4) return false;

  return (
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    (
      (buffer[2] === 0x03 && buffer[3] === 0x04) ||
      (buffer[2] === 0x05 && buffer[3] === 0x06) ||
      (buffer[2] === 0x07 && buffer[3] === 0x08)
    )
  );
}

function getImageMimeType(
  file: Express.Multer.File,
): string | null {
  const buffer = file.buffer;
  const extension = getExtension(file.originalname);

  if (
    extension === ".png" &&
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(
      Buffer.from([
        0x89,
        0x50,
        0x4e,
        0x47,
        0x0d,
        0x0a,
        0x1a,
        0x0a,
      ]),
    )
  ) {
    return "image/png";
  }

  if (
    (extension === ".jpg" || extension === ".jpeg") &&
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "image/jpeg";
  }

  if (
    extension === ".webp" &&
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
}

async function removeIfExists(filePath: string) {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    const code =
      error instanceof Error &&
      "code" in error
        ? String((error as NodeJS.ErrnoException).code)
        : "";

    if (code !== "ENOENT") {
      console.error(
        "[Resource Packs] Cleanup error:",
        error,
      );
    }
  }
}

resourcePacksRouter.get("/", async (_req, res) => {
  try {
    const packs = await getResourcePacks();

    res.json({
      ok: true,
      packs,
    });
  } catch (error) {
    console.error("[Resource Packs] Load error:", error);

    res.status(500).json({
      ok: false,
      error: "Failed to load resource packs.",
    });
  }
});

resourcePacksRouter.post(
  "/",
  upload.fields([
    {
      name: "pack",
      maxCount: 1,
    },
    {
      name: "image",
      maxCount: 1,
    },
  ]),
  async (req, res) => {
    let packPath: string | undefined;
    let imagePath: string | undefined;

    try {
      const files = req.files as
        | {
            pack?: Express.Multer.File[];
            image?: Express.Multer.File[];
          }
        | undefined;

      const packFile = files?.pack?.[0];
      const imageFile = files?.image?.[0];

      if (!packFile) {
        res.status(400).json({
          ok: false,
          error: "Resource Pack ZIP is required.",
        });
        return;
      }

      if (
        getExtension(packFile.originalname) !== ".zip" ||
        !isZipBuffer(packFile.buffer)
      ) {
        res.status(400).json({
          ok: false,
          error: "Invalid Resource Pack ZIP file.",
        });
        return;
      }

      if (packFile.size > MAX_PACK_SIZE) {
        res.status(413).json({
          ok: false,
          error: "Resource Pack is too large.",
        });
        return;
      }

      if (imageFile) {
        if (imageFile.size > MAX_IMAGE_SIZE) {
          res.status(413).json({
            ok: false,
            error: "Image is too large.",
          });
          return;
        }

        if (!getImageMimeType(imageFile)) {
          res.status(400).json({
            ok: false,
            error: "Invalid or corrupted image file.",
          });
          return;
        }
      }

      const name = safeText(req.body?.name, 100);
      const description = safeText(
        req.body?.description,
        1000,
      );
      const rawVersions: string[] =
        Array.isArray(req.body?.minecraftVersions)
          ? req.body.minecraftVersions.map((value: unknown) =>
              String(value),
            )
          : String(req.body?.minecraftVersions ?? "")
              .split(",")
              .map((value) => value.trim())
              .filter(Boolean);

      const minecraftVersions: string[] = [
        ...new Set(
          rawVersions
            .map((value: string) => safeText(value, 30))
            .filter(Boolean),
        ),
      ].slice(0, 50);

      const platform = safeText(
        req.body?.platform,
        20,
      );

      const loader = safeText(
        req.body?.loader,
        20,
      );

      const category = safeText(
        req.body?.category,
        40,
      );

      const allowedPlatforms = new Set([
        "java",
        "bedrock",
        "java-bedrock",
      ]);

      const allowedLoaders = new Set([
        "vanilla",
        "fabric",
        "forge",
        "neoforge",
        "quilt",
        "bedrock",
      ]);

      if (!name || !description) {
        res.status(400).json({
          ok: false,
          error: "Pack name and description are required.",
        });
        return;
      }

      if (minecraftVersions.length === 0) {
        res.status(400).json({
          ok: false,
          error: "At least one Minecraft version is required.",
        });
        return;
      }

      if (!allowedPlatforms.has(platform)) {
        res.status(400).json({
          ok: false,
          error: "Invalid Minecraft platform.",
        });
        return;
      }

      if (!allowedLoaders.has(loader)) {
        res.status(400).json({
          ok: false,
          error: "Invalid Minecraft loader.",
        });
        return;
      }

      if (!category) {
        res.status(400).json({
          ok: false,
          error: "Minecraft category is required.",
        });
        return;
      }

      const author = "NΞXUS XS User";

      const id = crypto.randomUUID();
      const filesDirectory =
        getResourcePackFilesDirectory();

      packPath = path.join(
        filesDirectory,
        `${id}.zip`,
      );

      await fs.writeFile(
        packPath,
        packFile.buffer,
        { flag: "wx" },
      );

      let imageUrl: string | undefined;

      if (imageFile) {
        const extension =
          getExtension(imageFile.originalname);

        imagePath = path.join(
          filesDirectory,
          `${id}${extension}`,
        );

        await fs.writeFile(
          imagePath,
          imageFile.buffer,
          { flag: "wx" },
        );

        imageUrl =
          `/api/resource-packs/${id}/image`;
      }

      const pack = await addResourcePack({
        id,
        name,
        description,
        minecraftVersions,
        platform: platform as
          | "java"
          | "bedrock"
          | "java-bedrock",
        loader: loader as
          | "vanilla"
          | "fabric"
          | "forge"
          | "neoforge"
          | "quilt"
          | "bedrock",
        category,
        author,
        image: imageUrl,
        downloadUrl:
          `/api/resource-packs/${id}/download`,
      });

      res.status(201).json({
        ok: true,
        pack,
      });
    } catch (error) {
      await removeIfExists(packPath ?? "");
      await removeIfExists(imagePath ?? "");

      console.error(
        "[Resource Packs] Publish error:",
        error,
      );

      res.status(500).json({
        ok: false,
        error: "Failed to publish resource pack.",
      });
    }
  },
);

resourcePacksRouter.get(
  "/:id/download",
  async (req, res) => {
    try {
      const id = safeText(req.params.id, 100);

      if (!/^[0-9a-f-]{36}$/i.test(id)) {
        res.status(400).json({
          ok: false,
          error: "Invalid resource pack ID.",
        });
        return;
      }

      const packs = await getResourcePacks();
      const pack = packs.find((item) => item.id === id);

      if (!pack) {
        res.status(404).json({
          ok: false,
          error: "Resource pack not found.",
        });
        return;
      }

      const filePath = path.join(
        getResourcePackFilesDirectory(),
        `${id}.zip`,
      );

      res.download(
        filePath,
        `${pack.name}.zip`,
        (error) => {
          if (error && !res.headersSent) {
            res.status(404).json({
              ok: false,
              error: "Resource pack file not found.",
            });
          }
        },
      );
    } catch (error) {
      console.error(
        "[Resource Packs] Download error:",
        error,
      );

      if (!res.headersSent) {
        res.status(500).json({
          ok: false,
          error: "Failed to download resource pack.",
        });
      }
    }
  },
);

resourcePacksRouter.get(
  "/:id/image",
  async (req, res) => {
    try {
      const id = safeText(req.params.id, 100);

      if (!/^[0-9a-f-]{36}$/i.test(id)) {
        res.status(400).end();
        return;
      }

      const packs = await getResourcePacks();
      const pack = packs.find((item) => item.id === id);

      if (!pack?.image) {
        res.status(404).end();
        return;
      }

      const extension =
        getExtension(pack.image);

      const mimeTypes: Record<string, string> = {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".webp": "image/webp",
      };

      const mimeType = mimeTypes[extension];

      if (!mimeType) {
        res.status(404).end();
        return;
      }

      const filePath = path.join(
        getResourcePackFilesDirectory(),
        `${id}${extension}`,
      );

      res.type(mimeType);
      res.sendFile(filePath, (error) => {
        if (error && !res.headersSent) {
          res.status(404).end();
        }
      });
    } catch (error) {
      console.error(
        "[Resource Packs] Image error:",
        error,
      );

      if (!res.headersSent) {
        res.status(500).end();
      }
    }
  },
);

resourcePacksRouter.use(
  (
    error: unknown,
    _req: import("express").Request,
    res: import("express").Response,
    _next: import("express").NextFunction,
  ) => {
    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        res.status(413).json({
          ok: false,
          error: "Uploaded file is too large.",
        });
        return;
      }

      res.status(400).json({
        ok: false,
        error: error.message,
      });
      return;
    }

    if (error instanceof Error) {
      res.status(400).json({
        ok: false,
        error: error.message,
      });
      return;
    }

    res.status(500).json({
      ok: false,
      error: "Upload failed.",
    });
  },
);

export { resourcePacksRouter };
