import React, { forwardRef } from "react";

type TextareaFieldProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: string;
  error?: string;
};

const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  ({ label, hint, error, className, required, id, ...props }, ref) => {
    const areaId = id ?? props.name ?? label.replace(/\s+/g, "-").toLowerCase();

    return (
      <div className="space-y-2">
        <label
          htmlFor={areaId}
          className="flex items-center gap-2 text-sm font-medium text-zinc-100"
        >
          {label}
          {required ? (
            <span className="text-xs text-zinc-400">(required)</span>
          ) : null}
        </label>
        <textarea
          id={areaId}
          ref={ref}
          required={required}
          className={`min-h-[120px] w-full rounded-xl border border-white/10 bg-zinc-950/60 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-purple-400/60 focus:ring-2 focus:ring-purple-500/30 ${
            error ? "border-rose-500/70 focus:border-rose-400" : ""
          } ${className ?? ""}`}
          {...props}
        />
        {hint ? <p className="text-xs text-zinc-500">{hint}</p> : null}
        {error ? <p className="text-xs text-rose-400">{error}</p> : null}
      </div>
    );
  },
);

TextareaField.displayName = "TextareaField";

export default TextareaField;
