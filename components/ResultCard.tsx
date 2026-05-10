"use client";

type ResultCardProps = {
  resultUrl: string;
  onDownload: () => void;
  onGenerateAnother: () => void;
};

export function ResultCard({
  resultUrl,
  onDownload,
  onGenerateAnother,
}: ResultCardProps) {
  return (
    <section className="space-y-4 rounded-lg border border-neutral-200 bg-white p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-neutral-900">Result</h2>
      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100">
        {/* eslint-disable-next-line @next/next/no-img-element -- CDN and dynamic result URLs */}
        <img
          src={resultUrl}
          alt="Generated attire result"
          className="mx-auto block h-auto w-full max-h-[min(90vh,900px)] object-contain"
        />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onDownload}
          className="inline-flex flex-1 items-center justify-center rounded-lg bg-accent px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#b69872] active:bg-[#a98a66]"
        >
          Download
        </button>
        <button
          type="button"
          onClick={onGenerateAnother}
          className="inline-flex flex-1 items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 py-3 text-center text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50"
        >
          Generate Another
        </button>
      </div>
    </section>
  );
}
