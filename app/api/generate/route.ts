import { NextRequest, NextResponse } from "next/server";
import { buildTryOnPrompt } from "@/lib/prompt";
import { runAndPollPrediction } from "@/lib/fashn";

export const runtime = "nodejs";
export const maxDuration = 300;

type Body = {
  modelImageUrl: string;
  attireImageUrl: string;
  backgroundImageUrl: string | null;
  poseStyle?: "sitting" | "standing";
  color?: string | null;
  peopleCount?: 1 | 2;
};

const EDIT_PROMPT =
  "Follow the background scenery as shown in the image context. Adjust the sitting or standing position of the people to match the background scenery.";

export async function POST(request: NextRequest) {
  const apiKey = process.env.FASHN_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server is missing FASHN_API_KEY." },
      { status: 500 }
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const modelImageUrl = typeof body.modelImageUrl === "string" ? body.modelImageUrl.trim() : "";
  const attireImageUrl =
    typeof body.attireImageUrl === "string" ? body.attireImageUrl.trim() : "";

  if (!modelImageUrl || !attireImageUrl) {
    return NextResponse.json(
      { error: "modelImageUrl and attireImageUrl are required." },
      { status: 400 }
    );
  }

  const poseStyle = body.poseStyle === "standing" ? "standing" : "sitting";
  const peopleCount = body.peopleCount === 2 ? 2 : 1;
  const color =
    typeof body.color === "string" && /^#[0-9A-Fa-f]{6}$/.test(body.color)
      ? body.color
      : null;
  const backgroundImageUrl =
    typeof body.backgroundImageUrl === "string" && body.backgroundImageUrl.trim()
      ? body.backgroundImageUrl.trim()
      : null;

  const hasBackgroundImage = Boolean(backgroundImageUrl);

  const prompt = buildTryOnPrompt({
    peopleCount,
    poseStyle,
    colorHex: color,
    hasBackgroundImage,
  });

  const tryOnResult = await runAndPollPrediction(apiKey, "tryon-max", {
    model_image: modelImageUrl,
    product_image: attireImageUrl,
    prompt,
    resolution: "1k",
  });

  if (!tryOnResult.ok) {
    return NextResponse.json(
      {
        error: tryOnResult.errorMessage,
        predictionId: tryOnResult.predictionId,
        predictionStage: "tryon",
      },
      { status: 422 }
    );
  }

  let finalUrl = tryOnResult.outputUrl;

  if (hasBackgroundImage && backgroundImageUrl) {
    const editResult = await runAndPollPrediction(apiKey, "edit", {
      image: finalUrl,
      prompt: EDIT_PROMPT,
      image_context: backgroundImageUrl,
      resolution: "1k",
    });

    if (!editResult.ok) {
      return NextResponse.json(
        {
          error: editResult.errorMessage,
          predictionId: editResult.predictionId,
          predictionStage: "edit",
        },
        { status: 422 }
      );
    }
    finalUrl = editResult.outputUrl;
  }

  return NextResponse.json({ resultUrl: finalUrl });
}
