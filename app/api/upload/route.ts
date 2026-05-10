import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

async function ensureUploadsDir(uploadsDir: string) {
  await fs.mkdir(uploadsDir, { recursive: true });
}

function extensionFromName(name: string): string {
  const ext = path.extname(name).toLowerCase();
  const allowed = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
  if (allowed.includes(ext)) return ext;
  return ".jpg";
}

export async function POST(request: NextRequest) {
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL;
    if (!base) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_BASE_URL is not configured." },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const fileField = formData.get("file");

    if (!fileField || !(fileField instanceof File)) {
      return NextResponse.json(
        { error: "Missing file field in multipart/form-data." },
        { status: 400 }
      );
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await ensureUploadsDir(uploadsDir);

    const ext = extensionFromName(fileField.name || "upload");
    const filename = `${randomUUID()}${ext}`;
    const filepath = path.join(uploadsDir, filename);

    const buffer = Buffer.from(await fileField.arrayBuffer());
    await fs.writeFile(filepath, buffer);

    const normalizedBase = base.replace(/\/$/, "");
    const url = `${normalizedBase}/uploads/${filename}`;

    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}
