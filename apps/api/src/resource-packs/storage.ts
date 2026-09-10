import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type ResourcePackPlatform =
  | "java"
  | "bedrock"
  | "java-bedrock";

export type ResourcePackLoader =
  | "vanilla"
  | "fabric"
  | "forge"
  | "neoforge"
  | "quilt"
  | "bedrock";

export type ResourcePack = {
  id: string;
  name: string;
  description: string;
  minecraftVersions: string[];
  platform: ResourcePackPlatform;
  loader: ResourcePackLoader;
  category: string;
  author: string;
  image?: string;
  downloadUrl?: string;
  createdAt: string;
};

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);
const projectRoot = path.resolve(currentDirectory, "../../../..");

const storageDirectory = path.join(
  projectRoot,
  "data/resource-packs",
);

const filePath = path.join(
  storageDirectory,
  "packs.json",
);

const filesDirectory = path.join(
  storageDirectory,
  "files",
);

async function ensureStorage() {
  await fs.mkdir(storageDirectory, { recursive: true });
  await fs.mkdir(filesDirectory, { recursive: true });

  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(
      filePath,
      "[]\n",
      "utf8",
    );
  }
}

export async function getResourcePacks(): Promise<ResourcePack[]> {
  await ensureStorage();

  const raw = await fs.readFile(
    filePath,
    "utf8",
  );

  const packs = JSON.parse(raw) as ResourcePack[];

  return packs.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() -
      new Date(a.createdAt).getTime(),
  );
}

export async function addResourcePack(
  item: Omit<ResourcePack, "createdAt">,
): Promise<ResourcePack> {
  const packs = await getResourcePacks();

  const pack: ResourcePack = {
    ...item,
    createdAt: new Date().toISOString(),
  };

  packs.unshift(pack);

  await fs.writeFile(
    filePath,
    JSON.stringify(packs, null, 2) + "\n",
    "utf8",
  );

  return pack;
}

export function getResourcePackFilesDirectory(): string {
  return filesDirectory;
}
