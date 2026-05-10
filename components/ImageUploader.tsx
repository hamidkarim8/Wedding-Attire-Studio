"use client";

import React, { useCallback, useEffect, useId, useMemo, useState } from "react";

export type ImageUploaderProps = {
  label: React.ReactNode;
  optionalBadge?: boolean;
  helperText?: React.ReactNode;
  file: File | null;
  onChange: (file: File | null) => void;
  error?: string;
  disabled?: boolean;
};

function previewUrl(file: File | null): string | undefined {
  if (!file) return undefined;
  return URL.createObjectURL(file);
}

export function ImageUploader({
  label,
  optionalBadge,
  helperText,
  file,
  onChange,
  error,
  disabled,
}: ImageUploaderProps) {
  const inputId = useId();
  const [localDrag, setLocalDrag] = useState(false);

  const objectUrl = useMemo(() => previewUrl(file), [file]);

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  const triggerSelect = () => {
    document.getElementById(inputId)?.click();
  };

  const acceptFiles = useCallback(
    (list: FileList | null) => {
      const first = list?.[0];
      if (first && first.type.startsWith("image/")) {
        onChange(first);
      }
    },
    [onChange]
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    acceptFiles(e.target.files);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setLocalDrag(false);
    if (disabled) return;
    acceptFiles(e.dataTransfer.files);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setLocalDrag(true);
  };

  const onDragLeave = () => setLocalDrag(false);

  const outline =
    error != null && error !== ""
      ? "ring-2 ring-red-600/30"
      : localDrag && !disabled
        ? "ring-2 ring-accent/80"
        : "";

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={inputId} className="text-sm font-medium text-neutral-900">
          {label}
        </label>
        {optionalBadge ? (
          <span className="rounded border border-neutral-200 bg-neutral-100 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-neutral-600">
            Optional
          </span>
        ) : null}
      </div>

      <input
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={onInputChange}
        disabled={disabled}
      />

      <button
        type="button"
        aria-disabled={disabled}
        disabled={disabled}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={triggerSelect}
        className={[
          "flex w-full flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white text-left transition hover:border-neutral-300",
          outline,
          disabled ? "cursor-not-allowed opacity-60" : "",
        ].join(" ")}
      >
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-[120px_minmax(0,1fr)] sm:items-center">
          <div className="relative aspect-square w-full overflow-hidden rounded-md bg-neutral-100 sm:h-[120px] sm:w-[120px]">
            {objectUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt="Upload preview"
                src={objectUrl}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center px-3 text-center text-xs text-neutral-500">
                <span>Drop image here</span>
                <span className="mt-2 text-neutral-400">or click to browse</span>
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-neutral-600">
              JPG, PNG formats are accepted.
            </p>
          </div>
        </div>
      </button>

      {helperText ? (
        <div className="text-xs leading-relaxed text-neutral-600">{helperText}</div>
      ) : null}

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
