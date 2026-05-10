import { NextRequest, NextResponse } from "next/server";
import { getPredictionStatus, runAndPollPrediction } from "@/lib/fashn";

export const runtime = "nodejs";
export const maxDuration = 300;

type Body = {
  predictionId?: string;
  predictionStage?: "tryon" | "edit";
  backgroundImageUrl?: string | null;
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

  const predictionId =
    typeof body.predictionId === "string" ? body.predictionId.trim() : "";
  const predictionStage = body.predictionStage === "edit" ? "edit" : "tryon";
  const backgroundImageUrl =
    typeof body.backgroundImageUrl === "string" && body.backgroundImageUrl.trim()
      ? body.backgroundImageUrl.trim()
      : null;

  if (!predictionId) {
    return NextResponse.json(
      { error: "predictionId is required." },
      { status: 400 }
    );
  }

  const status = await getPredictionStatus(apiKey, predictionId);

  if (status.status === "completed") {
    if (predictionStage === "tryon" && backgroundImageUrl) {
      const editResult = await runAndPollPrediction(apiKey, "edit", {
        image: status.outputUrl,
        prompt: EDIT_PROMPT,
        image_context: backgroundImageUrl,
        resolution: "1k",
      });

      if (!editResult.ok) {
        return NextResponse.json(
          {
            status: "failed",
            error: editResult.errorMessage,
            predictionId: editResult.predictionId,
            predictionStage: "edit",
          },
          { status: 422 }
        );
      }

      return NextResponse.json({
        status: "completed",
        resultUrl: editResult.outputUrl,
      });
    }

    return NextResponse.json({
      status: status.status,
      resultUrl: status.outputUrl,
    });
  }

  if (status.status === "failed") {
    return NextResponse.json(
      { status: status.status, error: status.errorMessage },
      { status: 422 }
    );
  }

  return NextResponse.json({ status: status.status });
}
