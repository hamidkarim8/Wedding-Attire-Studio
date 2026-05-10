export type PollResult =
  | { ok: true; outputUrl: string }
  | { ok: false; errorMessage: string; error?: unknown };

const POLL_INTERVAL_MS = 3000;
const THREE_MINUTES_MS = 180_000;

export function normalizeFashnError(err: unknown): string {
  if (!err || typeof err === "string") {
    return typeof err === "string" ? err : "Something went wrong with the AI service.";
  }
  if (
    typeof err === "object" &&
    err !== null &&
    "message" in err &&
    typeof (err as { message: unknown }).message === "string"
  ) {
    return (err as { message: string }).message;
  }
  return "Something went wrong with the AI service.";
}

async function submitRun(
  apiKey: string,
  modelName: string,
  inputs: Record<string, unknown>
): Promise<{ id: string } | { errorMessage: string; raw: unknown }> {
  const res = await fetch("https://api.fashn.ai/v1/run", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model_name: modelName, inputs }),
  });

  let payload: unknown;
  try {
    payload = await res.json();
  } catch {
    payload = await res.text().catch(() => null);
  }

  if (!res.ok || !payload || typeof payload !== "object") {
    const msg =
      typeof payload === "object" &&
      payload !== null &&
      "message" in payload &&
      typeof (payload as { message: unknown }).message === "string"
        ? (payload as { message: string }).message
        : `FASHN request failed (${res.status})`;
    return { errorMessage: msg, raw: payload };
  }

  const obj = payload as { id?: string; error?: unknown; message?: string };
  if (obj.error && typeof obj.error === "string") {
    return { errorMessage: obj.error, raw: payload };
  }
  if (typeof obj.message === "string" && typeof obj.id !== "string") {
    return { errorMessage: obj.message, raw: payload };
  }
  if (typeof obj.id === "string") {
    return { id: obj.id };
  }
  return {
    errorMessage: "No prediction ID returned.",
    raw: payload,
  };
}

async function pollStatusOnce(
  apiKey: string,
  id: string
): Promise<{
  status: string;
  outputUrls: string[] | null;
  error: unknown;
}> {
  const res = await fetch(`https://api.fashn.ai/v1/status/${id}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  let payload: unknown;
  try {
    payload = await res.json();
  } catch {
    return {
      status: "processing",
      outputUrls: null,
      error: null,
    };
  }

  if (!payload || typeof payload !== "object") {
    return {
      status: "processing",
      outputUrls: null,
      error: null,
    };
  }

  const p = payload as {
    status?: string;
    output?: unknown;
    error?: unknown;
  };

  let outputUrls: string[] | null = null;
  if (Array.isArray(p.output)) {
    const urls = p.output.filter((u): u is string => typeof u === "string");
    outputUrls = urls.length ? urls : null;
  }

  return {
    status: typeof p.status === "string" ? p.status : "processing",
    outputUrls,
    error: p.error ?? null,
  };
}

export async function runAndPollPrediction(
  apiKey: string,
  modelName: string,
  inputs: Record<string, unknown>,
  maxWaitMs = THREE_MINUTES_MS
): Promise<PollResult> {
  const submission = await submitRun(apiKey, modelName, inputs);
  if (!("id" in submission)) {
    return {
      ok: false,
      errorMessage: submission.errorMessage,
      error: submission.raw,
    };
  }

  const { id } = submission;

  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const { status, outputUrls, error } = await pollStatusOnce(apiKey, id);

    if (status === "completed" && outputUrls?.[0]) {
      return { ok: true, outputUrl: outputUrls[0] };
    }

    if (status === "failed") {
      return {
        ok: false,
        errorMessage: normalizeFashnError(error),
        error,
      };
    }

    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }

  return {
    ok: false,
    errorMessage:
      "The generation took longer than expected (over 3 minutes). Please try again.",
  };
}
