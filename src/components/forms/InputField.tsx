import React, { forwardRef, useRef } from "react";
import { LucideIcon } from "lucide-react";

type InputFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
  icon?: LucideIcon;
};

const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  (
    { label, hint, error, className, required, id, icon: Icon, ...props },
    ref,
  ) => {
    const internalRef = useRef<HTMLInputElement>(null);
    const setInputRef = (node: HTMLInputElement | null) => {
      internalRef.current = node;

      if (typeof ref === "function") {
        ref(node);
        return;
      }

      if (ref) {
        ref.current = node;
      }
    };

    const inputId =
      id ?? props.name ?? label.replace(/\s+/g, "-").toLowerCase();

    const handleIconClick = () => {
      const inputElement = internalRef.current;

      if (!inputElement) {
        return;
      }

      inputElement.focus({ preventScroll: true });

      if (typeof inputElement.showPicker === "function") {
        try {
          inputElement.showPicker();
          return;
        } catch {
          inputElement.click();
          return;
        }
      }

      inputElement.click();
    };

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
        <div className="relative">
          <input
            id={inputId}
            ref={setInputRef}
            required={required}
            className={`w-full rounded-xl border border-white/10 bg-zinc-950/60 ${Icon ? "pr-12" : "pr-4"} pl-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-purple-400/60 focus:ring-2 focus:ring-purple-500/30 scheme-dark ${
              error ? "border-rose-500/70 focus:border-rose-400" : ""
            } ${className ?? ""}`}
            {...props}
          />
          {Icon && (
            <button
              type="button"
              onClick={handleIconClick}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md border border-white/10 bg-white/5 p-1.5 text-white transition hover:border-purple-400/60 hover:bg-purple-500/20 hover:text-purple-100"
              tabIndex={-1}
              aria-label={`Open ${label}`}
            >
              <Icon size={18} strokeWidth={2} />
            </button>
          )}
        </div>
        {hint ? <p className="text-xs text-zinc-500">{hint}</p> : null}
        {error ? <p className="text-xs text-rose-400">{error}</p> : null}
      </div>
    );
  },
);

InputField.displayName = "InputField";

export default InputField;
