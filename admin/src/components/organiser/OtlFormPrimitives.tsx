"use client";

import {
  Children,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export function OtlSectionHead({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 font-sans text-[11px] font-semibold tracking-[0.12em] text-gold uppercase">
      {children}
    </div>
  );
}

export function OtlLabel({ children }: { children: ReactNode }) {
  return (
    <label className="mb-[5px] block font-sans text-[11px] tracking-[0.08em] text-[#888888] uppercase">
      {children}
    </label>
  );
}

export function OtlHelp({ children }: { children: ReactNode }) {
  return (
    <p className="mt-[3px] mb-0 font-sans text-[11px] text-[#555555]">
      {children}
    </p>
  );
}

function OtlChevron() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#555555"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function OtlFlatInput({
  icon,
  value,
  onChange,
  placeholder,
  type = "text",
  min,
}: {
  icon?: ReactNode;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  min?: string;
}) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasPicker = type === "date" || type === "time";

  const openPicker = () => {
    inputRef.current?.showPicker?.();
  };

  return (
    <div className="relative">
      {icon &&
        (hasPicker ? (
          <button
            type="button"
            tabIndex={-1}
            onClick={openPicker}
            className="absolute top-1/2 left-[11px] flex -translate-y-1/2 cursor-pointer items-center border-none bg-transparent p-0"
            aria-label={type === "date" ? "Open calendar" : "Open time picker"}
          >
            {icon}
          </button>
        ) : (
          <span className="pointer-events-none absolute top-1/2 left-[11px] flex -translate-y-1/2 items-center">
            {icon}
          </span>
        ))}
      <input
        ref={inputRef}
        className="otl-input w-full rounded-md border-none bg-white/[0.035] px-3 py-[9px] font-sans text-[13px] text-cream outline-none transition-[box-shadow,background] duration-150 placeholder:text-[#555555]"
        style={{
          paddingLeft: icon ? 34 : 12,
          boxShadow: focused ? "0 0 0 1px #C9A84C" : "none",
        }}
        type={type}
        min={min}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onClick={hasPicker ? openPicker : undefined}
      />
    </div>
  );
}

function parseSelectOptions(children: ReactNode) {
  const options: { value: string; label: string }[] = [];
  Children.forEach(children, (child) => {
    if (isValidElement(child) && child.type === "option") {
      const props = child.props as { value?: string; children?: ReactNode };
      options.push({
        value: props.value ?? "",
        label: String(props.children ?? ""),
      });
    }
  });
  return options;
}

export function OtlFlatSelect({
  icon,
  value,
  onChange,
  children,
}: {
  icon?: ReactNode;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const options = parseSelectOptions(children);
  const selected = options.find((opt) => opt.value === value);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setFocused(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((prev) => !prev);
          setFocused(true);
        }}
        onBlur={() => {
          if (!open) setFocused(false);
        }}
        className="w-full cursor-pointer rounded-md border-none bg-white/[0.035] py-[9px] pr-[34px] pl-[34px] text-left font-sans text-[13px] outline-none transition-[box-shadow,background] duration-150"
        style={{
          color: value ? "#F5F0E8" : "#555555",
          boxShadow: focused || open ? "0 0 0 1px #C9A84C" : "none",
        }}
      >
        {selected?.label ?? "Select…"}
      </button>

      {icon && (
        <span className="pointer-events-none absolute top-1/2 left-[11px] z-[1] flex -translate-y-1/2 items-center">
          {icon}
        </span>
      )}

      <span
        className="pointer-events-none absolute top-1/2 right-2.5 flex -translate-y-1/2 items-center transition-transform duration-150"
        style={{ transform: open ? "translateY(-50%) rotate(180deg)" : "translateY(-50%)" }}
      >
        <OtlChevron />
      </span>

      {open && (
        <div className="absolute top-[calc(100%+6px)] right-0 left-0 z-[100] overflow-hidden rounded-md border border-[#222222] bg-void shadow-[0_8px_28px_rgba(0,0,0,0.5)]">
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <button
                key={opt.value || "__empty__"}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                  setFocused(false);
                }}
                className="block w-full cursor-pointer border-none px-3.5 py-2.5 text-left font-sans text-[13px] transition-colors duration-150"
                style={{
                  background: active ? "rgba(201,168,76,0.12)" : "transparent",
                  color: active ? "#F5F0E8" : opt.value ? "#F5F0E8" : "#888888",
                  boxShadow: active ? "inset 2px 0 0 #C9A84C" : "none",
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = "transparent";
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function OtlFlatTextarea({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="relative">
      <textarea
        className="otl-input h-[108px] w-full resize-none rounded-md border-none bg-white/[0.035] px-3 py-[9px] font-sans text-[13px] text-cream outline-none transition-[box-shadow,background] duration-150 placeholder:text-[#555555]"
        style={{ boxShadow: focused ? "0 0 0 1px #C9A84C" : "none" }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Describe your event, lineup, and what attendees can expect..."
        maxLength={500}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      <span className="pointer-events-none absolute right-2.5 bottom-2 font-sans text-[11px] text-[#555555]">
        {value.length}/500
      </span>
    </div>
  );
}

export function OtlIconCalendar({ className = "text-gold" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

export function OtlIconClock({ className = "text-gold" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15 15" />
    </svg>
  );
}

export function OtlIconPerson({ className = "text-gold" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function OtlIconMapPin({ className = "text-gold" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export function OtlIconLink({ className = "text-gold" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

export function OtlIconBuilding({ className = "text-gold" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

export function OtlIconHash({ className = "text-gold" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" y1="9" x2="20" y2="9" />
      <line x1="4" y1="15" x2="20" y2="15" />
      <line x1="10" y1="3" x2="8" y2="21" />
      <line x1="16" y1="3" x2="14" y2="21" />
    </svg>
  );
}

export function OtlBackIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}
