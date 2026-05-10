"use client";

import { useCallback, useEffect, useState } from "react";

import { CollectionGrid } from "@/components/CollectionGrid";
import type { CollectionGridItem } from "@/components/CollectionGrid";
import { ColorPicker } from "@/components/ColorPicker";
import { ImageUploader } from "@/components/ImageUploader";
import { LoadingState, type StepRow } from "@/components/LoadingState";
import { ResultCard } from "@/components/ResultCard";

type Tab = "studio" | "collection";
type PoseStyle = "sitting" | "standing";
type WorkflowPhase =
  | "idle"
  | "uploading-model"
  | "uploading-attire"
  | "uploading-background"
  | "generating"
  | "finalising";

function deriveSteps(hasBackground: boolean, phase: WorkflowPhase): StepRow[] {
  const orderedIds = [
    "upload-model",
    "upload-attire",
    ...(hasBackground ? ["upload-background"] : []),
    "tryon",
    "finalize",
  ];
  const activeIdByPhase: Record<WorkflowPhase, string | null> = {
    idle: null,
    "uploading-model": "upload-model",
    "uploading-attire": "upload-attire",
    "uploading-background": "upload-background",
    generating: "tryon",
    finalising: "finalize",
  };
  const activeId = activeIdByPhase[phase];
  const activeIndex = activeId ? orderedIds.indexOf(activeId) : -1;
  const getState = (id: string): StepRow["state"] => {
    const stepIndex = orderedIds.indexOf(id);
    if (stepIndex === -1 || activeIndex === -1) return "upcoming";
    if (stepIndex < activeIndex) return "done";
    if (stepIndex === activeIndex) return "active";
    return "upcoming";
  };

  return [
    {
      id: "upload-model",
      label: "Uploading model photo",
      visibility: true,
      state: getState("upload-model"),
    },
    {
      id: "upload-attire",
      label: "Uploading wedding attire",
      visibility: true,
      state: getState("upload-attire"),
    },
    {
      id: "upload-background",
      label: "Uploading background scenery",
      visibility: hasBackground,
      state: getState("upload-background"),
    },
    {
      id: "tryon",
      label: "Generating virtual try-on",
      visibility: true,
      state: getState("tryon"),
    },
    {
      id: "finalize",
      label: "Saving result to collection",
      visibility: true,
      state: getState("finalize"),
    },
  ];
}

async function uploadToServer(
  file: File
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  const data = (await res.json().catch(() => ({}))) as { url?: unknown; error?: unknown };
  if (!res.ok) {
    return {
      ok: false,
      error: typeof data.error === "string" ? data.error : "Upload failed.",
    };
  }
  if (typeof data.url !== "string") {
    return { ok: false, error: "Upload response invalid." };
  }
  return { ok: true, url: data.url };
}

type PersistRefs = {
  modelUrl: string;
  attireUrl: string;
  backgroundUrl: string | null;
  poseStyle: PoseStyle;
  color: string | null;
  peopleCount: 1 | 2;
};

type PendingPrediction = {
  id: string;
  stage: "tryon" | "edit";
  refs: PersistRefs;
};

export default function HomePage() {
  const [tab, setTab] = useState<Tab>("studio");

  const [modelFile, setModelFile] = useState<File | null>(null);
  const [attireFile, setAttireFile] = useState<File | null>(null);
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [peopleCount, setPeopleCount] = useState<1 | 2>(1);
  const [poseStyle, setPoseStyle] = useState<PoseStyle>("sitting");
  const [attireColor, setAttireColor] = useState<string | null>(null);

  const [modelUploadError, setModelUploadError] = useState<string | undefined>(
    undefined
  );
  const [attireUploadError, setAttireUploadError] = useState<string | undefined>(
    undefined
  );
  const [backgroundUploadError, setBackgroundUploadError] = useState<
    string | undefined
  >(undefined);
  const [formError, setFormError] = useState<string | undefined>(undefined);
  const [collectionNote, setCollectionNote] = useState<string | undefined>(
    undefined
  );

  const [phase, setPhase] = useState<WorkflowPhase>("idle");

  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [lastRefs, setLastRefs] = useState<PersistRefs | null>(null);
  const [pendingPrediction, setPendingPrediction] =
    useState<PendingPrediction | null>(null);
  const [checkingPrediction, setCheckingPrediction] = useState(false);

  const [collection, setCollection] = useState<CollectionGridItem[]>([]);

  const busy =
    phase === "uploading-model" ||
    phase === "uploading-attire" ||
    phase === "uploading-background" ||
    phase === "generating" ||
    phase === "finalising" ||
    checkingPrediction;

  const loadCollection = useCallback(async () => {
    const res = await fetch("/api/collection");
    const data = (await res.json().catch(() => [])) as unknown;
    if (Array.isArray(data)) {
      setCollection(data as CollectionGridItem[]);
    }
  }, []);

  useEffect(() => {
    if (tab !== "collection") return;
    void loadCollection();
  }, [tab, loadCollection]);

  const showLoader =
    phase === "uploading-model" ||
    phase === "uploading-attire" ||
    phase === "uploading-background" ||
    phase === "generating" ||
    phase === "finalising";

  const stepRows = deriveSteps(backgroundFile !== null, phase);

  const resetForm = useCallback(() => {
    setModelFile(null);
    setAttireFile(null);
    setBackgroundFile(null);
    setPeopleCount(1);
    setPoseStyle("sitting");
    setAttireColor(null);
    setModelUploadError(undefined);
    setAttireUploadError(undefined);
    setBackgroundUploadError(undefined);
    setFormError(undefined);
    setCollectionNote(undefined);
    setPhase("idle");
    setResultUrl(null);
    setLastRefs(null);
    setPendingPrediction(null);
    setCheckingPrediction(false);
  }, []);

  const persistCollection = async (params: PersistRefs & { resultUrl: string }) => {
    const payload = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      resultUrl: params.resultUrl,
      modelImageUrl: params.modelUrl,
      attireImageUrl: params.attireUrl,
      backgroundImageUrl: params.backgroundUrl,
      poseStyle: params.poseStyle,
      color: params.color,
      peopleCount: params.peopleCount,
    };
    const res = await fetch("/api/collection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const errText = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg =
        typeof (errText as { error?: unknown }).error === "string"
          ? (errText as { error: string }).error
          : "Saving to Collection failed.";
      setCollectionNote(
        `${msg} Your image is shown above — you may still download it.`
      );
    } else setCollectionNote(undefined);
  };

  const runGenerateWithRefs = async (refs: PersistRefs) => {
    setPhase("generating");
    setPendingPrediction(null);

    const genRes = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modelImageUrl: refs.modelUrl,
        attireImageUrl: refs.attireUrl,
        backgroundImageUrl: refs.backgroundUrl,
        poseStyle: refs.poseStyle,
        color: refs.color,
        peopleCount: refs.peopleCount,
      }),
    });

    const genJson = (await genRes.json().catch(() => ({}))) as {
      error?: unknown;
      resultUrl?: unknown;
      predictionId?: unknown;
      predictionStage?: unknown;
    };

    if (!genRes.ok) {
      const msg =
        typeof genJson.error === "string"
          ? genJson.error
          : "Generation failed.";
      if (
        typeof genJson.predictionId === "string" &&
        (genJson.predictionStage === "tryon" || genJson.predictionStage === "edit")
      ) {
        setPendingPrediction({
          id: genJson.predictionId,
          stage: genJson.predictionStage,
          refs,
        });
      }
      setFormError(msg);
      setPhase("idle");
      return;
    }

    const outUrl = genJson.resultUrl;
    if (typeof outUrl !== "string") {
      setFormError("Generation returned an unexpected response.");
      setPhase("idle");
      return;
    }

    setPhase("finalising");
    setPendingPrediction(null);
    setResultUrl(outUrl);
    await persistCollection({ ...refs, resultUrl: outUrl });
    setPhase("idle");
  };

  const handleGenerate = async () => {
    setFormError(undefined);
    setCollectionNote(undefined);
    setModelUploadError(undefined);
    setAttireUploadError(undefined);
    setBackgroundUploadError(undefined);

    if (!modelFile || !attireFile) {
      setFormError("Model photo and wedding attire photos are required.");
      return;
    }

    const colorNorm = attireColor?.match(/^#[0-9A-Fa-f]{6}$/)
      ? attireColor.toUpperCase()
      : null;

    setPhase("uploading-model");

    const mUp = await uploadToServer(modelFile);
    if (!mUp.ok) {
      setModelUploadError(mUp.error);
      setPhase("idle");
      return;
    }

    setPhase("uploading-attire");
    const aUp = await uploadToServer(attireFile);
    if (!aUp.ok) {
      setAttireUploadError(aUp.error);
      setPhase("idle");
      return;
    }

    let backgroundUrl: string | null = null;
    if (backgroundFile) {
      setPhase("uploading-background");
      const bUp = await uploadToServer(backgroundFile);
      if (!bUp.ok) {
        setBackgroundUploadError(bUp.error);
        setPhase("idle");
        return;
      }
      backgroundUrl = bUp.url;
    }

    const refs: PersistRefs = {
      modelUrl: mUp.url,
      attireUrl: aUp.url,
      backgroundUrl,
      poseStyle,
      color: colorNorm,
      peopleCount,
    };

    setLastRefs(refs);
    await runGenerateWithRefs(refs);
  };

  const loweredError = (formError ?? "").toLowerCase();
  const isTimeoutOrSlowError =
    loweredError.includes("3 minutes") ||
    loweredError.includes("longer than expected");

  const handleRetryGeneration = async () => {
    setCollectionNote(undefined);
    if (lastRefs && isTimeoutOrSlowError) {
      setFormError(undefined);
      await runGenerateWithRefs(lastRefs);
      return;
    }
    await handleGenerate();
  };

  const handleCheckPredictionStatus = async () => {
    if (!pendingPrediction) return;

    setCheckingPrediction(true);
    setFormError(undefined);
    setCollectionNote(undefined);

    const res = await fetch("/api/generate/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        predictionId: pendingPrediction.id,
        predictionStage: pendingPrediction.stage,
        backgroundImageUrl: pendingPrediction.refs.backgroundUrl,
      }),
    });

    const data = (await res.json().catch(() => ({}))) as {
      status?: unknown;
      resultUrl?: unknown;
      error?: unknown;
      predictionId?: unknown;
      predictionStage?: unknown;
    };

    setCheckingPrediction(false);

    if (
      !res.ok &&
      typeof data.predictionId === "string" &&
      (data.predictionStage === "tryon" || data.predictionStage === "edit")
    ) {
      setPendingPrediction({
        ...pendingPrediction,
        id: data.predictionId,
        stage: data.predictionStage,
      });
    }

    if (res.ok && data.status === "completed" && typeof data.resultUrl === "string") {
      setPendingPrediction(null);
      setPhase("finalising");
      setResultUrl(data.resultUrl);
      await persistCollection({
        ...pendingPrediction.refs,
        resultUrl: data.resultUrl,
      });
      setPhase("idle");
      return;
    }

    if (res.ok && data.status === "processing") {
      setFormError("This FASHN job is still processing. Check again in a moment.");
      return;
    }

    setFormError(
      typeof data.error === "string"
        ? data.error
        : "Unable to check the generation status."
    );
  };

  const canGenerate = Boolean(modelFile) && Boolean(attireFile) && !busy;

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col px-5 pb-20 pt-10 sm:px-8 lg:max-w-5xl">
      <nav
        aria-label="Main"
        className="mb-10 flex rounded-lg border border-neutral-200 bg-white p-1"
      >
        <button
          type="button"
          onClick={() => setTab("studio")}
          className={[
            "flex-1 rounded-md px-4 py-2 text-center text-sm font-semibold transition",
            tab === "studio"
              ? "bg-accent text-white"
              : "text-neutral-700 hover:bg-neutral-100",
          ].join(" ")}
        >
          Studio
        </button>
        <button
          type="button"
          onClick={() => setTab("collection")}
          className={[
            "flex-1 rounded-md px-4 py-2 text-center text-sm font-semibold transition",
            tab === "collection"
              ? "bg-accent text-white"
              : "text-neutral-700 hover:bg-neutral-100",
          ].join(" ")}
        >
          Collection
        </button>
      </nav>

      {tab === "collection" ? (
        <CollectionGrid
          items={collection}
          onRefreshRequested={() => void loadCollection()}
        />
      ) : (
        <div className="space-y-10">
          <header className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl">
              Wedding Attire Studio
            </h1>
            <p className="text-sm text-neutral-600">
              AI-powered virtual wedding attire fitting
            </p>
          </header>

          <section aria-label="Generation form" className="space-y-8">
            <ImageUploader
              label="Model Photo"
              helperText={
                <>
                  Upload a photo with 1 or 2 faces only.
                  <br />
                  - 1 face: solo fitting for groom or bride
                  <br />
                  - 2 faces: couple fitting (groom and bride together)
                  <br />
                  Use a clear, well-lit photo with the subject(s) facing forward.
                  <br />
                  Avoid sunglasses, hats, or obstructions on the face.
                  <br />A neutral background gives the best result.
                </>
              }
              file={modelFile}
              onChange={(f) => {
                setModelFile(f);
                setModelUploadError(undefined);
              }}
              disabled={busy}
              error={modelUploadError}
            />

            <fieldset disabled={busy} className="space-y-3">
              <legend className="sr-only">Number of people in photo</legend>
              <span className="text-sm font-medium text-neutral-900">
                Number of people in photo
              </span>
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm hover:border-accent/40">
                  <input
                    type="radio"
                    name="people"
                    checked={peopleCount === 1}
                    onChange={() => setPeopleCount(1)}
                    className="accent-[#C4A882]"
                  />
                  <span className="text-neutral-800">1 Person</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm hover:border-accent/40">
                  <input
                    type="radio"
                    name="people"
                    checked={peopleCount === 2}
                    onChange={() => setPeopleCount(2)}
                    className="accent-[#C4A882]"
                  />
                  <span className="text-neutral-800">2 People</span>
                </label>
              </div>
            </fieldset>

            <ImageUploader
              label="Wedding Attire"
              helperText={
                <>
                  Upload the wedding attire you want to try on.
                  <br />
                  For best results, use an attire photo without a model wearing it.
                  <br />A plain or white background works best.
                </>
              }
              file={attireFile}
              onChange={(f) => {
                setAttireFile(f);
                setAttireUploadError(undefined);
              }}
              disabled={busy}
              error={attireUploadError}
            />

            <fieldset disabled={busy} className="space-y-3">
              <legend className="sr-only">Posing style</legend>
              <span id="posing-label" className="text-sm font-medium text-neutral-900">
                Posing Style
              </span>
              <div
                aria-labelledby="posing-label"
                className="grid grid-cols-1 gap-3 sm:grid-cols-2"
              >
                {(
                  [
                    {
                      key: "sitting" as const,
                      title: "Sitting",
                      desc: "Groom and bride seated side by side",
                    },
                    {
                      key: "standing" as const,
                      title: "Standing",
                      desc: "Groom and bride standing side by side",
                    },
                  ] as const
                ).map((opt) => {
                  const active = poseStyle === opt.key;
                  return (
                    <button
                      type="button"
                      key={opt.key}
                      onClick={() => setPoseStyle(opt.key)}
                      className={[
                        "rounded-lg border bg-white px-4 py-4 text-left shadow-sm outline-none ring-accent transition hover:border-neutral-400",
                        active
                          ? "border-accent ring-2 ring-offset-2"
                          : "border-neutral-200",
                      ].join(" ")}
                    >
                      <span className="block text-base font-semibold text-neutral-900">
                        {opt.title}
                      </span>
                      <span className="mt-2 block text-sm text-neutral-600">
                        {opt.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <ImageUploader
              label="Background Scenery"
              optionalBadge
              helperText={
                <>
                  Upload a background image for the scene.
                  <br />If left empty, a white-themed Malaysian wedding pelamin kahwin will be used.
                </>
              }
              file={backgroundFile}
              onChange={(f) => {
                setBackgroundFile(f);
                setBackgroundUploadError(undefined);
              }}
              disabled={busy}
              error={backgroundUploadError}
            />

            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-neutral-900">
                  Attire Color
                </span>
                <span className="rounded border border-neutral-200 bg-neutral-100 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-neutral-600">
                  Optional
                </span>
              </div>
              <ColorPicker
                disabled={busy}
                selected={attireColor}
                onSelect={(hex) => setAttireColor(hex)}
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row-reverse">
              <button
                type="button"
                disabled={!canGenerate}
                onClick={() => void handleGenerate()}
                className={[
                  "inline-flex flex-1 items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold text-white shadow-sm ring-accent outline-none ring-offset-2 transition focus-visible:ring-2",
                  canGenerate
                    ? "bg-accent hover:bg-[#b69872] active:bg-[#a98a66]"
                    : "cursor-not-allowed bg-accent/35",
                ].join(" ")}
              >
                Generate
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={resetForm}
                className="inline-flex flex-1 items-center justify-center rounded-lg border border-neutral-300 px-6 py-3 text-sm font-semibold text-neutral-900 hover:bg-neutral-50"
              >
                Reset
              </button>
            </div>

            {formError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
                <p>{formError}</p>
                {pendingPrediction ? (
                  <div className="mt-4 rounded-lg border border-red-200 bg-white/70 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-red-800">
                      FASHN job saved
                    </p>
                    <p className="mt-1 break-all text-xs text-red-700">
                      Prediction ID: {pendingPrediction.id}
                    </p>
                    <p className="mt-2 text-xs text-red-700">
                      If this was a timeout, the AI job may still finish. Check
                      status instead of starting a brand-new generation.
                    </p>
                    <button
                      type="button"
                      onClick={() => void handleCheckPredictionStatus()}
                      disabled={busy || checkingPrediction}
                      className="mt-3 inline-flex rounded-lg bg-red-950/85 px-4 py-2 text-xs font-semibold text-white hover:bg-red-950 disabled:opacity-60"
                    >
                      {checkingPrediction ? "Checking..." : "Check final status"}
                    </button>
                  </div>
                ) : null}
                {isTimeoutOrSlowError && (
                  <button
                    type="button"
                    onClick={() => void handleRetryGeneration()}
                    disabled={busy}
                    className="mt-4 inline-flex rounded-lg bg-red-950/85 px-4 py-2 text-xs font-semibold text-white hover:bg-red-950 disabled:opacity-60"
                  >
                    Retry generation
                  </button>
                )}
              </div>
            ) : null}

            {showLoader ? <LoadingState steps={stepRows} /> : null}

            {collectionNote ? (
              <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                {collectionNote}
              </p>
            ) : null}

            {resultUrl && phase === "idle" ? (
              <ResultCard
                resultUrl={resultUrl}
                onDownload={() =>
                  window.open(resultUrl, "_blank", "noopener,noreferrer")
                }
                onGenerateAnother={resetForm}
              />
            ) : null}
          </section>
        </div>
      )}
    </main>
  );
}
