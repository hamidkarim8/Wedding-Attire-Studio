"use client";

import { useMemo, useState } from "react";

export type CollectionGridItem = {
  id: string;
  timestamp: string;
  resultUrl: string;
  poseStyle: "sitting" | "standing";
  peopleCount: number;
  color: string | null;
};

export function CollectionGrid({
  items,
  onRefreshRequested,
}: {
  items: CollectionGridItem[];
  onRefreshRequested?: () => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const formatted = useMemo(
    () =>
      items.map((it) => ({
        ...it,
        localeTime: formatLocal(it.timestamp),
      })),
    [items]
  );

  if (!items.length) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-10 text-center">
        <p className="text-sm text-neutral-600">
          No generations yet. Go to Studio to get started.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap gap-4">
        {onRefreshRequested ? (
          <button
            type="button"
            onClick={() => onRefreshRequested()}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
          >
            Refresh list
          </button>
        ) : null}
      </div>
      <ul className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {formatted.map((it) => (
          <li
            key={it.id}
            className="flex flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <button
              type="button"
              onClick={() => setPreviewUrl(it.resultUrl)}
              className="block w-full bg-neutral-100 text-left outline-none ring-accent focus-visible:ring-2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- CDN and user uploads use dynamic hosts */}
              <img
                src={it.resultUrl}
                alt="Saved generation thumbnail"
                className="aspect-[3/4] w-full cursor-zoom-in object-cover"
              />
            </button>

            <div className="flex flex-1 flex-col gap-2 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                {it.localeTime}
              </p>

              <div className="flex flex-wrap gap-2">
                <span className="rounded border border-neutral-200 bg-neutral-50 px-2 py-1 text-[11px] font-medium capitalize text-neutral-700">
                  {it.poseStyle}
                </span>
                <span className="rounded border border-neutral-200 bg-neutral-50 px-2 py-1 text-[11px] font-medium text-neutral-700">
                  {it.peopleCount} {it.peopleCount === 1 ? "person" : "people"}
                </span>
              </div>

              {it.color ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-600">Color</span>
                  <span
                    className="inline-block h-5 w-5 rounded-full border border-neutral-300"
                    title={it.color}
                    aria-label={`Color ${it.color}`}
                    style={{ backgroundColor: it.color }}
                  />
                </div>
              ) : null}

              <div className="mt-auto flex gap-2">
                <a
                  href={it.resultUrl}
                  download=""
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex flex-1 items-center justify-center rounded-lg bg-accent px-3 py-2 text-center text-xs font-semibold text-white hover:bg-[#b69872]"
                >
                  Download
                </a>
                <button
                  type="button"
                  className="inline-flex flex-1 items-center justify-center rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-900 hover:bg-neutral-50"
                  onClick={() => setPreviewUrl(it.resultUrl)}
                >
                  View
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {previewUrl ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Full size image preview"
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) setPreviewUrl(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setPreviewUrl(null);
          }}
          tabIndex={-1}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <figure className="relative max-h-[90vh] max-w-[min(920px,calc(100vw-32px))] overflow-hidden rounded-lg bg-black">
            <button
              type="button"
              className="absolute right-3 top-3 rounded-md border border-white/70 bg-neutral-950/75 px-3 py-1 text-xs font-medium text-white hover:bg-neutral-950"
              aria-label="Close preview"
              onClick={() => setPreviewUrl(null)}
            >
              Close
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Full preview of generation"
              className="max-h-[85vh] w-full object-contain"
            />
          </figure>
        </div>
      ) : null}
    </>
  );
}

function formatLocal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
