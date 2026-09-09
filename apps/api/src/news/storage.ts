import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

export type NewsItem = {
  id: string;
  title: string;
  description: string;
  url: string;
  image?: string;
  source?: string;
  author?: string;
  createdAt: string;
};

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);
const projectRoot = path.resolve(currentDirectory, "../../../..");

const filePath = path.join(
  projectRoot,
  "data/news/news.json",
);

async function ensureStorage() {
  await fs.mkdir(path.dirname(filePath), { recursive: true });

  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, "[]\n", "utf8");
  }
}

export async function getNews(): Promise<NewsItem[]> {
  await ensureStorage();

  const raw = await fs.readFile(filePath, "utf8");
  const items = JSON.parse(raw) as NewsItem[];

  return items.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() -
      new Date(a.createdAt).getTime(),
  );
}

export async function addNews(
  item: Omit<NewsItem, "id" | "createdAt">,
): Promise<NewsItem> {
  const items = await getNews();

  const news: NewsItem = {
    ...item,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };

  items.unshift(news);

  await fs.writeFile(
    filePath,
    JSON.stringify(items, null, 2) + "\n",
    "utf8",
  );

  return news;
}
