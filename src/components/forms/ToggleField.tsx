import React from "react";

type ToggleFieldProps = {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
};

export default function ToggleField({
  id,
  label,
  description,
  checked,
  onChange,
}: ToggleFieldProps) {
  return (
    <div className="flex items-center justify-between gap-6 rounded-xl border border-white/10 bg-zinc-950/60 px-4 py-3">
      <div>
        <p className="text-sm font-medium text-zinc-100">{label}</p>
        {description ? (
          <p className="text-xs text-zinc-500">{description}</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 rounded-full border border-white/10 transition ${
          checked
            ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500"
            : "bg-zinc-800"
        }`}
        aria-pressed={checked}
        aria-controls={id}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
            checked ? "right-1" : "left-1"
          }`}
        />
      </button>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="sr-only"
      />
    </div>
  );
}
