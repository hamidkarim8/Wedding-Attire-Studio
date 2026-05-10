import fs from "fs/promises";
import path from "path";

export type CollectionItem = {
  id: string;
  timestamp: string;
  resultUrl: string;
  modelImageUrl: string;
  attireImageUrl: string;
  backgroundImageUrl: string | null;
  poseStyle: "sitting" | "standing";
  color: string | null;
  peopleCount: 1 | 2;
};

const DATA_DIR = path.join(process.cwd(), "data");
export const COLLECTION_PATH = path.join(DATA_DIR, "collection.json");

async function ensureCollectionFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true }).catch(() => undefined);
  try {
    await fs.access(COLLECTION_PATH);
  } catch {
    await fs.writeFile(COLLECTION_PATH, "[]", "utf-8");
  }
}

export async function readCollection(): Promise<CollectionItem[]> {
  await ensureCollectionFile();
  const raw = await fs.readFile(COLLECTION_PATH, "utf-8");
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as CollectionItem[]) : [];
  } catch {
    return [];
  }
}

export async function appendCollectionItem(
  item: CollectionItem
): Promise<void> {
  await ensureCollectionFile();
  const existing = await readCollection();
  existing.unshift(item);
  await fs.writeFile(
    COLLECTION_PATH,
    JSON.stringify(existing, null, 2),
    "utf-8"
  );
}
