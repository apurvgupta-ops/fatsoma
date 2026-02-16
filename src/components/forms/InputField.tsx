import React, { forwardRef } from "react";

type InputFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
};

const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, hint, error, className, required, id, ...props }, ref) => {
    const inputId =
      id ?? props.name ?? label.replace(/\s+/g, "-").toLowerCase();

    return (
      <div className="space-y-2">
        <label
          htmlFor={inputId}
          className="flex items-center gap-2 text-sm font-medium text-zinc-100"
        >
          {label}
          {required ? (
            <span className="text-xs text-zinc-400">(required)</span>
          ) : null}
        </label>
        <input
          id={inputId}
          ref={ref}
          required={required}
          className={`w-full rounded-xl border border-white/10 bg-zinc-950/60 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-purple-400/60 focus:ring-2 focus:ring-purple-500/30 ${
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

InputField.displayName = "InputField";

export default InputField;
