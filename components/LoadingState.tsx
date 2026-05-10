"use client";

import { useEffect, useState } from "react";

export type StepRow = {
  id: string;
  label: string;
  visibility: boolean;
  state: "upcoming" | "active" | "done";
};

export function Spinner({ small }: { small?: boolean }) {
  const size = small ? "h-4 w-4 border-2" : "h-5 w-5 border-2";
  return (
    <span
      className={`${size} rounded-full border-neutral-300 border-t-accent animate-spin`}
      aria-hidden
    />
  );
}

function CheckMark() {
  return (
    <span
      className="flex h-5 w-5 items-center justify-center rounded-full border border-emerald-500/70 bg-emerald-50 text-emerald-800"
      aria-hidden
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <path
          d="M2 7 L5.75 10.75 L12 4"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function LoadingState({ steps }: { steps: StepRow[] }) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const visibleSteps = steps.filter((s) => s.visibility !== false);
  const activeIndex = visibleSteps.findIndex((step) => step.state === "active");
  const doneCount = visibleSteps.filter((step) => step.state === "done").length;
  const progress =
    visibleSteps.length > 0
      ? Math.round(((doneCount + (activeIndex >= 0 ? 0.5 : 0)) / visibleSteps.length) * 100)
      : 0;
  const activeStep = activeIndex >= 0 ? visibleSteps[activeIndex] : null;
  const elapsedLabel = `${Math.floor(elapsedSeconds / 60)}:${String(
    elapsedSeconds % 60
  ).padStart(2, "0")}`;

  useEffect(() => {
    setElapsedSeconds(0);
    const timer = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div
      className="overflow-hidden rounded-2xl border border-accent/20 bg-white shadow-sm"
      aria-live="polite"
      role="status"
    >
      <div className="relative border-b border-neutral-100 bg-gradient-to-br from-accent/10 via-white to-neutral-50 p-6">
        <div className="absolute right-6 top-6 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
          <span className="absolute h-14 w-14 animate-ping rounded-full bg-accent/20" />
          <span className="absolute h-10 w-10 animate-pulse rounded-full bg-accent/10" />
          <span className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-accent/30">
            <span className="h-3 w-3 animate-ping rounded-full bg-accent" />
            <span className="absolute h-3 w-3 rounded-full bg-accent" />
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 pr-20">
          <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-red-700 ring-1 ring-red-200">
            <span className="h-2 w-2 animate-ping rounded-full bg-red-500" />
            Live
          </span>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-neutral-600 ring-1 ring-neutral-200">
            Running {elapsedLabel}
          </span>
        </div>
        <h2 className="mt-2 pr-16 text-lg font-semibold text-neutral-950">
          {activeStep?.label ?? "Preparing your result"}
          <span className="inline-flex w-8 justify-start">
            <span className="animate-pulse">...</span>
          </span>
        </h2>
        <p className="mt-2 max-w-lg text-sm text-neutral-600">
          Stage {Math.max(activeIndex + 1, 1)} of {visibleSteps.length}. Keep this
          page open while we finish the virtual fitting.
        </p>
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-xs font-medium text-neutral-600">
            <span>{progress}% complete</span>
            <span>{doneCount} done</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-neutral-200">
            <div
              className="relative h-full rounded-full bg-accent transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            >
              <span className="loading-shimmer absolute inset-0 bg-white/45" />
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-4 rounded-xl border border-accent/20 bg-white/80 px-4 py-3 shadow-sm">
          <div className="flex h-9 items-end gap-1" aria-hidden>
            {[0, 1, 2, 3, 4].map((bar) => (
              <span
                key={bar}
                className="loading-equalizer-bar w-1.5 rounded-full bg-accent"
                style={{ animationDelay: `${bar * 0.12}s` }}
              />
            ))}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-neutral-900">
              Still working — live activity detected
            </p>
            <p className="text-xs text-neutral-500">
              The moving bars and timer will keep updating while the request runs.
            </p>
          </div>
        </div>
      </div>

      <ol className="space-y-4 p-6">
        {visibleSteps.map((step) => {
          const faded = step.state === "upcoming";
          const active = step.state === "active";
          return (
            <li
              key={step.id}
              className={[
                "flex items-start gap-3 rounded-xl border p-3 transition",
                active
                  ? "border-accent/30 bg-accent/5 shadow-sm"
                  : "border-transparent",
              ].join(" ")}
            >
              <div className="mt-1">
                {step.state === "done" ? (
                  <CheckMark />
                ) : step.state === "active" ? (
                  <Spinner />
                ) : (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border border-neutral-300 text-[10px] text-neutral-500">
                    ...
                  </span>
                )}
              </div>
              <div className={`min-w-0 flex-1 ${faded ? "text-neutral-400" : ""}`}>
                <p
                  className={[
                    "text-sm",
                    active
                      ? "font-semibold text-neutral-950"
                      : faded
                        ? "text-neutral-400"
                        : "text-neutral-800",
                  ].join(" ")}
                >
                  {step.label}
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  {step.state === "done"
                    ? "Completed"
                    : step.state === "active"
                      ? "In progress now"
                      : "Waiting"}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
