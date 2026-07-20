"use client";

import { useEffect, useState } from "react";
import type { EventResponse } from "@/lib/shared";
import type { EventInsightsData, TierView } from "@/lib/eventDisplay";
import { getTierViews } from "@/lib/eventDisplay";
import { VelocityChart } from "./VelocityChart";

const card =
  "rounded-[10px] border border-[#222222] bg-[#141414] p-5";
const cardSm = `${card} p-[17px]`;
const head =
  "mb-4 font-sans text-[11px] font-semibold tracking-[0.12em] text-gold uppercase";
const headSm = "mb-[13px] font-sans text-[9px] font-semibold tracking-[0.12em] text-gold uppercase";
const statLbl =
  "font-sans text-[10px] font-semibold tracking-[0.14em] text-[#888888] uppercase";
const statLblSm =
  "font-sans text-[8px] font-semibold tracking-[0.14em] text-[#888888] uppercase";
const ctx = "m-0 font-sans text-xs leading-[1.7] text-[#888888]";
const ctxSm = "m-0 font-sans text-[10px] leading-[1.7] text-[#888888]";

function BarFill({ percent, delayMs = 0 }: { percent: number; delayMs?: number }) {
  const [w, setW] = useState(percent);
  useEffect(() => {
    const t = window.setTimeout(() => setW(percent), 80);
    return () => window.clearTimeout(t);
  }, [percent]);
  return (
    <div className="h-1 rounded-sm bg-[#222222]">
      <div
        className="h-full rounded-sm bg-gold"
        style={{
          width: `${w}%`,
          transition: `width 800ms cubic-bezier(0.16,1,0.3,1) ${delayMs}ms`,
        }}
      />
    </div>
  );
}

function TotalSoldCard({ tiers }: { tiers: TierView[] }) {
  const totalCapacity = tiers.reduce((a, t) => a + t.capacity, 0);
  const totalSold = tiers.reduce((a, t) => a + t.sold, 0);
  return (
    <div className={card}>
      <div className={`${statLbl} mb-3`}>Total sold</div>
      <div className="mb-3 font-sans text-4xl font-bold text-gold">
        {totalSold} / {totalCapacity}
      </div>
      <p className={ctx}>Tickets sold across every tier, out of total capacity.</p>
    </div>
  );
}

function GrossRevenueCard({ tiers }: { tiers: TierView[] }) {
  const gross = tiers.reduce((a, t) => a + t.price * t.sold, 0);
  return (
    <div className={card}>
      <div className={`${statLbl} mb-3`}>Gross revenue</div>
      <div className="mb-3 font-sans text-4xl font-bold text-gold">
        £{gross.toLocaleString()}
      </div>
      <p className={ctx}>Total ticket revenue across every tier, before fees.</p>
    </div>
  );
}

const JOKE_TIERS = [
  { min: 0, max: 60, jokes: ["That's a month of Tesco meal deals, right there."] },
  { min: 60, max: 150, jokes: ["That's a month of Deliveroo, delivery fee included."] },
  { min: 150, max: 350, jokes: ["That's a weekend in Brighton, sorted."] },
  { min: 350, max: 700, jokes: ["That's a flight to Montenegro this summer, sorted."] },
  { min: 700, max: Infinity, jokes: ["That's your whole spring break, covered."] },
];

function RecoveredHero({
  data,
  isCompleted,
}: {
  data: EventInsightsData;
  isCompleted: boolean;
}) {
  const messages =
    (JOKE_TIERS.find((t) => data.recovered >= t.min && data.recovered < t.max) ??
      JOKE_TIERS[0]).jokes;
  const [idx, setIdx] = useState(0);
  const [vis, setVis] = useState(true);

  useEffect(() => {
    const id = window.setInterval(() => {
      setVis(false);
      window.setTimeout(() => {
        setIdx((i) => (i + 1) % messages.length);
        setVis(true);
      }, 380);
    }, 3050);
    return () => window.clearInterval(id);
  }, [messages.length]);

  const annual = Math.round(data.recovered * data.eventsPerYear);

  return (
    <div className={`${card} px-6 pt-5 pb-4 text-center`}>
      <div className={statLbl}>
        {isCompleted ? "Recovered from resale" : "Recovered so far"}
      </div>
      <div className="mt-3 mb-2 flex items-baseline justify-center gap-2.5">
        <div className="font-sans text-[42px] font-bold leading-none text-gold">
          £{data.recovered.toLocaleString()}
        </div>
        <div className="font-sans text-[13px] font-semibold text-[#555555] line-through">
          £0
        </div>
      </div>
      <div className="mb-3 font-sans text-xs text-[#555555]">
        This is money from tickets that sold above their original price, the same
        upgrades shown below.
      </div>
      <div
        className="mb-3.5 min-h-[22px] font-sans text-[13px] leading-[1.7] text-[#888888] transition-opacity duration-[380ms]"
        style={{ opacity: vis ? 1 : 0 }}
      >
        {messages[idx]}
      </div>
      <div className="mb-4 font-sans text-[11px] text-[#555555]">
        On track for around £{annual.toLocaleString()} a year if you keep hosting at
        this rate.
      </div>
      <div className="border-t border-[#222222] pt-3.5 font-sans text-[13px] text-[#888888]">
        On any other platform, this would've gone to scalpers. Here, it came to you.
      </div>
    </div>
  );
}

function SalesByTier({
  tiers,
  tierUpgrades = [],
}: {
  tiers: TierView[];
  tierUpgrades?: EventInsightsData["tierUpgrades"];
}) {
  return (
    <div className={cardSm}>
      <div className={headSm}>Sales by tier</div>
      <p className={`${ctxSm} mb-4`}>
        Tickets that started in a lower tier but sold at a higher one after that
        tier sold out.
      </p>
      <div className="flex flex-col gap-[15px]">
        {tiers.map((tier, i) => {
          const pct =
            tier.capacity > 0 ? Math.round((tier.sold / tier.capacity) * 100) : 0;
          const revenue = tier.sold * tier.price;
          const upgrade = tierUpgrades[i];
          return (
            <div key={tier.name}>
              <div className="mb-1.5 flex items-baseline justify-between">
                <span className="font-sans text-[11px] font-bold text-cream">
                  {tier.name}{" "}
                  <span className="text-gold">· £{tier.price.toFixed(2)}</span>
                </span>
                <span className="font-sans text-[11px] font-bold text-gold">
                  {tier.sold} / {tier.capacity}
                </span>
              </div>
              {upgrade && upgrade.count > 0 && (
                <div className="mb-1.5 font-sans text-[9px] leading-normal text-gold">
                  <strong>{upgrade.count}</strong> tickets moved up from{" "}
                  {upgrade.from} once it sold out, earning{" "}
                  <strong>£{upgrade.earned}</strong> more than you would have at any
                  other platform.
                </div>
              )}
              <BarFill percent={pct} delayMs={i * 60} />
              <div className="mt-2 font-sans text-[9px] text-[#555555]">
                £{revenue.toLocaleString()} revenue
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ShowUpRate({ data }: { data: EventInsightsData }) {
  return (
    <div className={cardSm}>
      <div className={headSm}>Show-up rate</div>
      <div className="flex flex-col gap-[13px]">
        {[
          { label: "Resale holders", value: data.showUpResale },
          { label: "Original buyers", value: data.showUpPrimary, delay: 80 },
        ].map((row) => (
          <div key={row.label}>
            <div className="mb-1 flex justify-between">
              <span className="font-sans text-[9px] tracking-[0.08em] text-[#888888] uppercase">
                {row.label}
              </span>
              <span className="font-sans text-[11px] font-bold text-gold">
                {row.value}%
              </span>
            </div>
            <BarFill percent={row.value} delayMs={row.delay} />
            <div className="mt-0.5 font-sans text-[9px] text-[#555555]">showed up</div>
          </div>
        ))}
      </div>
      <p className={`${ctxSm} mt-[13px]`}>
        People who buy in late tend to actually turn up. Resale tickets go to people
        who chose to be there, days or hours before the event.
      </p>
    </div>
  );
}

function EmptySeats({ data }: { data: EventInsightsData }) {
  return (
    <div className={cardSm}>
      <div className={`${statLblSm} mb-2.5`}>Empty seats rescued</div>
      <div className="mb-2.5 font-sans text-[30px] font-bold text-gold">
        {data.emptySeatsRescued}
      </div>
      <p className={ctxSm}>
        Tickets that would've been no-shows. Resold to people who actually turned up.
      </p>
    </div>
  );
}

function VelocitySection({ data }: { data: EventInsightsData }) {
  return (
    <div className={cardSm}>
      <div className="mb-[13px] flex items-center justify-between">
        <div className={`${headSm} mb-0`}>Resale Velocity</div>
        <span className="font-sans text-[10px] text-gold">
          {data.totalResales} resale{data.totalResales === 1 ? "" : "s"} total
        </span>
      </div>
      <p className={`${ctxSm} mb-[13px]`}>
        How fast tickets changed hands as the date neared.
      </p>
      <VelocityChart data={data.velocityData} />
      <p className={`${ctxSm} mt-[11px]`}>
        The last-minute panic is real. And now it is measurable.
      </p>
    </div>
  );
}

export function InsightsDraft() {
  return (
    <div className="flex items-center justify-center py-20">
      <p className="max-w-[340px] text-center font-sans text-[13px] leading-[1.7] text-[#555555]">
        Insights appear once your event is published and tickets go on sale.
      </p>
    </div>
  );
}

export function InsightsCancelled({ data }: { data: EventInsightsData }) {
  return (
    <div className="flex flex-col gap-4">
      <div className={card}>
        <div className="mb-5 font-sans text-[11px] font-semibold tracking-[0.1em] text-[#888888] uppercase">
          Event cancelled
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className={statLbl}>Tickets refunded</div>
            <div className="font-sans text-[28px] font-bold text-cream">
              {data.ticketsRefunded}
            </div>
          </div>
          {data.totalResales > 0 && (
            <div>
              <div className={statLbl}>Resales before cancellation</div>
              <div className="font-sans text-[28px] font-bold text-cream">
                {data.totalResales}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function InsightsPublished({
  event,
  data,
}: {
  event: EventResponse;
  data: EventInsightsData;
}) {
  const tiers = getTierViews(event);
  return (
    <div className="flex flex-col gap-3.5">
      <div className="otl-insights-2col">
        <GrossRevenueCard tiers={tiers} />
        <TotalSoldCard tiers={tiers} />
      </div>
      <RecoveredHero data={data} isCompleted={false} />
      <SalesByTier tiers={tiers} tierUpgrades={data.tierUpgrades} />
      <div className="otl-insights-2col">
        <EmptySeats data={data} />
        <div className={`${cardSm} flex items-center justify-center`}>
          <p className="text-center font-sans text-[9px] leading-[1.7] text-[#555555] italic">
            Show-up rate will appear
            <br />
            after the event.
          </p>
        </div>
      </div>
      <VelocitySection data={data} />
    </div>
  );
}

export function InsightsCompleted({
  event,
  data,
}: {
  event: EventResponse;
  data: EventInsightsData;
}) {
  const tiers = getTierViews(event);
  return (
    <div className="flex flex-col gap-3.5">
      <div className="otl-insights-2col">
        <GrossRevenueCard tiers={tiers} />
        <TotalSoldCard tiers={tiers} />
      </div>
      <RecoveredHero data={data} isCompleted />
      <SalesByTier tiers={tiers} tierUpgrades={data.tierUpgrades} />
      <div className="otl-insights-2col">
        <EmptySeats data={data} />
        <ShowUpRate data={data} />
      </div>
      <VelocitySection data={data} />
    </div>
  );
}

export function EventInsightsTab({
  event,
  displayStatus,
  insights,
}: {
  event: EventResponse;
  displayStatus: string;
  insights: EventInsightsData | null;
}) {
  if (!insights || displayStatus === "draft") return <InsightsDraft />;
  if (displayStatus === "cancelled") return <InsightsCancelled data={insights} />;
  if (displayStatus === "published")
    return <InsightsPublished event={event} data={insights} />;
  return <InsightsCompleted event={event} data={insights} />;
}
