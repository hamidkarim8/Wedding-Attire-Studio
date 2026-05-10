import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
  appendCollectionItem,
  readCollection,
  type CollectionItem,
} from "@/lib/collection";

export const runtime = "nodejs";

type PostBody = {
  id?: string;
  timestamp?: string;
  resultUrl?: string;
  modelImageUrl?: string;
  attireImageUrl?: string;
  backgroundImageUrl?: string | null;
  poseStyle?: "sitting" | "standing";
  color?: string | null;
  peopleCount?: 1 | 2;
};

export async function GET() {
  const items = await readCollection();
  const sorted = [...items].sort(
    (a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  return NextResponse.json(sorted);
}

export async function POST(request: NextRequest) {
  let body: PostBody;
  try {
    body = (await request.json()) as PostBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const resultUrl =
    typeof body.resultUrl === "string" ? body.resultUrl.trim() : "";
  const modelImageUrl =
    typeof body.modelImageUrl === "string" ? body.modelImageUrl.trim() : "";
  const attireImageUrl =
    typeof body.attireImageUrl === "string" ? body.attireImageUrl.trim() : "";

  if (!resultUrl || !modelImageUrl || !attireImageUrl) {
    return NextResponse.json(
      { error: "resultUrl, modelImageUrl, and attireImageUrl are required." },
      { status: 400 }
    );
  }

  const item: CollectionItem = {
    id: typeof body.id === "string" ? body.id : randomUUID(),
    timestamp:
      typeof body.timestamp === "string" ? body.timestamp : new Date().toISOString(),
    resultUrl,
    modelImageUrl,
    attireImageUrl,
    backgroundImageUrl:
      typeof body.backgroundImageUrl === "string" && body.backgroundImageUrl.trim()
        ? body.backgroundImageUrl.trim()
        : null,
    poseStyle: body.poseStyle === "standing" ? "standing" : "sitting",
    color:
      typeof body.color === "string" && /^#[0-9A-Fa-f]{6}$/.test(body.color)
        ? body.color
        : null,
    peopleCount: body.peopleCount === 2 ? 2 : 1,
  };

  await appendCollectionItem(item);
  return NextResponse.json(item, { status: 201 });
}
