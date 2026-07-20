"use client";

import { useEffect, useRef, useState } from "react";

const VELOCITY_BUCKETS = ["14d", "10d", "7d", "4d", "2d", "1d"];
const CHART_HEIGHT = 190;
const GOLD = "#C9A84C";
const MUTED = "#888888";
const DIM = "#555555";
const BORDER = "#222222";
const SANS = "var(--font-geist-sans), Inter, system-ui, sans-serif";

function niceMax(v: number) {
  if (v <= 4) return Math.max(1, Math.ceil(v));
  const magnitude = 10 ** Math.floor(Math.log10(v));
  const residual = v / magnitude;
  const niceResidual =
    residual <= 1 ? 1 : residual <= 2 ? 2 : residual <= 5 ? 5 : 10;
  return niceResidual * magnitude;
}

export function VelocityChart({
  data,
}: {
  data: { label: string; count: number }[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [measuredWidth, setMeasuredWidth] = useState(520);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [lastHoverIdx, setLastHoverIdx] = useState<number | null>(null);
  const [gradientId] = useState(
    () => `velocity-gradient-${Math.random().toString(36).slice(2, 9)}`,
  );

  useEffect(() => {
    if (hoverIdx != null) setLastHoverIdx(hoverIdx);
  }, [hoverIdx]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width;
      if (w) setMeasuredWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const lastIdx = data.reduce((acc, d) => {
    const i = VELOCITY_BUCKETS.indexOf(d.label);
    return i > acc ? i : acc;
  }, -1);

  const W = measuredWidth;
  const H = CHART_HEIGHT;
  const PL = 32;
  const PR = 8;
  const PT = 16;
  const PB = 22;
  const cW = W - PL - PR;
  const cH = H - PT - PB;
  const n = VELOCITY_BUCKETS.length;

  const yMax = niceMax(Math.max(...data.map((d) => d.count), 1));
  const yTicks = [0, yMax / 2, yMax];

  const cx = (i: number) => PL + (n > 1 ? (i / (n - 1)) * cW : cW / 2);
  const cy = (v: number) => PT + cH - (v / yMax) * cH;

  const plotted = VELOCITY_BUCKETS.map((label, i) => ({
    label,
    i,
    count: data.find((d) => d.label === label)?.count,
  })).filter((d) => d.i <= lastIdx && d.count != null) as {
    label: string;
    i: number;
    count: number;
  }[];

  const linePath = plotted
    .map((d, idx) => `${idx === 0 ? "M" : "L"} ${cx(d.i).toFixed(1)} ${cy(d.count).toFixed(1)}`)
    .join(" ");
  const areaPath = plotted.length
    ? `M ${cx(plotted[0].i).toFixed(1)} ${(PT + cH).toFixed(1)} ${linePath.replace(/^M/, "L")} L ${cx(plotted[plotted.length - 1].i).toFixed(1)} ${(PT + cH).toFixed(1)} Z`
    : "";

  const hovered = hoverIdx != null ? plotted.find((p) => p.i === hoverIdx) : null;
  const displayed =
    hovered ??
    plotted.find((p) => p.i === lastHoverIdx) ??
    plotted[plotted.length - 1] ??
    null;

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ height: CHART_HEIGHT }}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width={W}
        height={H}
        className="block h-full w-full"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={GOLD} stopOpacity="0.4" />
            <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
          </linearGradient>
        </defs>
        {yTicks.map((v, idx) => (
          <g key={idx}>
            <line
              x1={PL}
              y1={cy(v)}
              x2={PL + cW}
              y2={cy(v)}
              stroke={BORDER}
              strokeWidth="0.5"
            />
            <text
              x={PL - 6}
              y={cy(v) + 3}
              textAnchor="end"
              style={{ fontSize: 9, fontFamily: SANS, fill: MUTED }}
            >
              {Math.round(v)}
            </text>
          </g>
        ))}
        <line
          x1={PL}
          y1={PT}
          x2={PL}
          y2={PT + cH}
          stroke={BORDER}
          strokeWidth="0.5"
        />
        {areaPath && <path d={areaPath} fill={`url(#${gradientId})`} />}
        {linePath && (
          <path
            d={linePath}
            stroke={GOLD}
            strokeWidth="2.5"
            fill="none"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}
        {plotted.map((d, idx) => (
          <circle
            key={idx}
            cx={cx(d.i)}
            cy={cy(d.count)}
            fill={GOLD}
            r={hoverIdx === d.i ? 5.5 : 3}
            style={{ transition: "r 180ms cubic-bezier(0.16,1,0.3,1)" }}
          />
        ))}
        {VELOCITY_BUCKETS.map((label, i) => (
          <text
            key={label}
            x={cx(i)}
            y={H - 6}
            textAnchor="middle"
            style={{
              fontSize: 9,
              fontFamily: SANS,
              fill: i <= lastIdx ? MUTED : DIM,
            }}
          >
            {label}
          </text>
        ))}
        {plotted.map((d) => (
          <rect
            key={`hit-${d.i}`}
            x={cx(d.i) - cW / n / 2}
            y={PT}
            width={cW / n}
            height={cH}
            fill="transparent"
            className="cursor-pointer"
            onMouseEnter={() => setHoverIdx(d.i)}
            onMouseLeave={() =>
              setHoverIdx((prev) => (prev === d.i ? null : prev))
            }
          />
        ))}
      </svg>
      {displayed &&
        (() => {
          const days = parseInt(displayed.label, 10);
          return (
            <div
              className="pointer-events-none z-[5] whitespace-nowrap rounded-md border border-gold bg-surface px-2.5 py-1.5 font-sans text-[10px] text-[#888888] shadow-[0_4px_16px_rgba(0,0,0,0.45)]"
              style={{
                position: "absolute",
                left: cx(displayed.i),
                top: cy(displayed.count),
                transform: `translate(-50%, calc(-100% - 12px)) scale(${hovered ? 1 : 0.9})`,
                transformOrigin: "bottom center",
                opacity: hovered ? 1 : 0,
                transition: "opacity 180ms ease, transform 180ms ease",
              }}
            >
              <span className="font-bold text-gold">
                {days} day{days === 1 ? "" : "s"} before event
              </span>
              : {displayed.count} resale{displayed.count === 1 ? "" : "s"}
            </div>
          );
        })()}
    </div>
  );
}
