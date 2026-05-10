"use client";

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
  const visibleSteps = steps.filter((s) => s.visibility !== false);

  return (
    <div
      className="rounded-lg border border-neutral-200 bg-white p-6"
      aria-live="polite"
      role="status"
    >
      <p className="mb-5 text-sm font-medium text-neutral-900">Generating</p>
      <ol className="space-y-4">
        {visibleSteps.map((step) => {
          const faded = step.state === "upcoming";
          return (
            <li key={step.id} className="flex items-start gap-3">
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
                <p className="text-sm text-neutral-800">{step.label}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
