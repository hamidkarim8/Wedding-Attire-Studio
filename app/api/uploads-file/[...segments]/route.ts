import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MIME: Record<string, string> = {
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

function safeFileUnderUploads(segments: string[]): string | null {
  const uploadsRoot = path.resolve(process.cwd(), "public", "uploads");
  const joined = segments
    .map((s) => decodeURIComponent(s).replace(/\\/g, "/"))
    .join("/");

  if (!joined || joined.includes("..")) {
    return null;
  }

  const abs = path.resolve(uploadsRoot, joined);
  const rootWithSep = uploadsRoot.endsWith(path.sep)
    ? uploadsRoot
    : `${uploadsRoot}${path.sep}`;

  if (abs !== uploadsRoot && !abs.startsWith(rootWithSep)) {
    return null;
  }

  return abs;
}

export async function GET(
  _request: Request,
  context: { params: { segments?: string[] } }
) {
  const raw = context.params?.segments;
  if (!Array.isArray(raw) || raw.length === 0) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const filepath = safeFileUnderUploads(raw);
  if (!filepath) {
    return new NextResponse("Not Found", { status: 404 });
  }

  let buffer: Buffer;
  try {
    buffer = await fs.readFile(filepath);
  } catch {
    return new NextResponse("Not Found", { status: 404 });
  }

  const ext = path.extname(filepath).toLowerCase();
  const contentType = MIME[ext] ?? "application/octet-stream";

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
