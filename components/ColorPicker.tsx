"use client";

export const COLOR_PRESETS: { label: string; hex: string }[] = [
  { label: "White", hex: "#FFFFFF" },
  { label: "Ivory", hex: "#FFFFF0" },
  { label: "Champagne", hex: "#F7E7CE" },
  { label: "Gold", hex: "#CFB53B" },
  { label: "Blush Pink", hex: "#FFB6C1" },
  { label: "Dusty Rose", hex: "#DCAE96" },
  { label: "Maroon", hex: "#800000" },
  { label: "Burgundy", hex: "#800020" },
  { label: "Navy", hex: "#001F5B" },
  { label: "Sage Green", hex: "#BCB88A" },
  { label: "Black", hex: "#000000" },
];

type ColorPickerProps = {
  selected: string | null;
  onSelect: (hex: string | null) => void;
  disabled?: boolean;
};

export function ColorPicker({
  selected,
  onSelect,
  disabled,
}: ColorPickerProps) {
  const normalized = selected?.toUpperCase();

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {COLOR_PRESETS.map((p) => {
          const active = normalized === p.hex.toUpperCase();
          return (
            <button
              key={p.hex}
              type="button"
              title={p.label}
              aria-label={`${p.label} ${p.hex}`}
              disabled={disabled}
              onClick={() => onSelect(p.hex)}
              className={[
                "relative flex h-9 w-9 items-center justify-center rounded-full border",
                disabled ? "cursor-not-allowed opacity-60" : "hover:opacity-90",
                active
                  ? "border-neutral-900 ring-2 ring-offset-2 ring-neutral-900/10"
                  : "border-neutral-300",
              ].join(" ")}
              style={{ backgroundColor: p.hex }}
            >
              <span className="sr-only">
                {p.label} ({p.hex})
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-xs font-medium text-neutral-700" htmlFor="custom-color-input">
          Custom
        </label>
        <input
          id="custom-color-input"
          type="color"
          aria-label="Custom color picker"
          value={selected ?? "#FFFFFF"}
          onChange={(e) => onSelect(e.target.value.toUpperCase())}
          disabled={disabled}
          className="h-9 w-[4.25rem] cursor-pointer overflow-hidden rounded-md border border-neutral-200 bg-white p-0 disabled:opacity-60"
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => onSelect(null)}
          className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Clear
        </button>
      </div>
      {normalized ? (
        <p className="text-xs text-neutral-600">Selected: {normalized}</p>
      ) : (
        <p className="text-xs text-neutral-500">No color selected.</p>
      )}
    </div>
  );
}
