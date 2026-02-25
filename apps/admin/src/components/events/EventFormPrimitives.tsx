import React, { useRef } from "react";
import { CalendarDays, Clock } from "lucide-react";

export function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-zinc-950/60 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
      <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-white">
        <span className="text-purple-400">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export function InputField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  className,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasIcon = type === "date" || type === "time";
  const Icon = type === "date" ? CalendarDays : type === "time" ? Clock : null;

  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-medium text-zinc-300">
        {label}
        {required && <span className="ml-0.5 text-purple-400">*</span>}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-xl border border-white/10 bg-zinc-900/60 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 ${hasIcon ? "pr-10" : ""}`}
        />
        {hasIcon && Icon && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => inputRef.current?.showPicker?.()}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 transition hover:text-white"
          >
            <Icon className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-zinc-300">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-white/10 bg-zinc-900/60 px-4 py-2.5 text-sm text-white outline-none transition focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ToggleField({
  label,
  checked,
  onChange,
  description,
}: {
  label: string;
  checked: boolean;
  onChange: (val: boolean) => void;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-zinc-900/40 px-4 py-3">
      <div>
        <p className="text-sm font-medium text-zinc-300">{label}</p>
        {description && <p className="mt-0.5 text-xs text-zinc-500">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
          checked ? "bg-purple-500" : "bg-zinc-700"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
