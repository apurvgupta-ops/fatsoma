"use client";

import { useEffect, useRef, useState } from "react";

function ProblemRow({
  headline,
  card,
  borderTop,
  rowStyle,
  textLeft,
  isMobile,
}: {
  headline: string;
  card: React.ReactNode;
  borderTop: boolean;
  rowStyle: React.CSSProperties;
  textLeft: boolean;
  isMobile: boolean;
}) {
  if (isMobile) {
    return (
      <div className="mb-9" style={rowStyle}>
        <div className="mb-4">{card}</div>
        <p className="m-0 text-[clamp(17px,4.5vw,22px)] leading-tight font-extrabold tracking-[-0.01em] text-cream uppercase whitespace-pre-line">
          {headline}
        </p>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-[160px] max-h-[260px] flex-1 items-center justify-center"
      style={{
        borderTop: borderTop ? "1px solid #1E1E1E" : "none",
        paddingTop: borderTop ? "32px" : 0,
        paddingBottom: "32px",
        ...rowStyle,
      }}
    >
      <div
        className={`flex max-w-[780px] items-center gap-14 lg:gap-56 ${
          textLeft ? "flex-row" : "flex-row-reverse"
        }`}
      >
        <div className="w-[clamp(200px,28vw,320px)] shrink-0">
          <p className="m-0 text-[clamp(16px,2vw,26px)] leading-tight font-extrabold tracking-[-0.01em] text-cream uppercase whitespace-pre-line">
            {headline}
          </p>
        </div>
        <div className="w-[clamp(260px,34vw,420px)] shrink-0">{card}</div>
      </div>
    </div>
  );
}

export default function SoundFamiliar() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.15 },
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const rowStyle = (delay: number): React.CSSProperties => ({
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(28px)",
    transition: `opacity 500ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 500ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
  });

  const cardBase: React.CSSProperties = {
    background: "#1A1A1A",
    border: "1px solid #2A2A2A",
    borderRadius: "14px",
    boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
    width: "100%",
    maxWidth: isMobile ? "100%" : "400px",
    overflow: "hidden",
  };

  const card1 = (
    <div
      className="relative px-7 py-6"
      style={{ ...cardBase, overflow: "visible" }}
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="font-jost text-[10px] tracking-[0.14em] text-gold">
          ON THE LIST
        </span>
        <span className="text-xs text-[#4CAF74]">✓</span>
      </div>
      <div className="mb-3 font-sans text-[13px] text-[#888888]">
        General Admission
      </div>
      <div className="flex gap-[3px]">
        {Array.from({ length: 22 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[1px] bg-[#2E2E2E]"
            style={{
              width: "3px",
              height: i % 3 === 0 ? "28px" : "20px",
            }}
          />
        ))}
      </div>
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 rounded-md border-4 border-[#E05252] bg-[rgba(26,26,26,0.6)] px-[22px] py-2 text-[36px] font-black tracking-[0.06em] text-[#E05252] whitespace-nowrap">
        VOID
      </div>
    </div>
  );

  const card2 = (
    <div style={{ ...cardBase, background: "#1C1C1E" }}>
      <div className="relative flex items-center justify-center border-b border-border px-3.5 py-2.5">
        <div className="absolute left-3.5 flex gap-1.5">
          {["#E05252", "#C9A84C", "#4CAF74"].map((c) => (
            <div
              key={c}
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: c }}
            />
          ))}
        </div>
        <span className="text-xs font-semibold text-cream">Messages</span>
      </div>
      <div className="flex flex-col gap-2 p-3.5">
        <div className="max-w-[80%] self-start rounded-2xl rounded-bl-sm bg-[#3A3A3C] px-3 py-2 text-[13px] text-cream">
          yeah it&apos;s legit trust me
        </div>
        <div className="max-w-[80%] self-end rounded-2xl rounded-br-sm bg-[#2A6496] px-3 py-2 text-[13px] text-cream">
          how do I know it&apos;ll scan
        </div>
        <div className="max-w-[80%] self-start rounded-2xl rounded-bl-sm bg-[#3A3A3C] px-3 py-2 text-[13px] text-cream">
          just send the money first lol
        </div>
        <div className="flex items-center gap-1 self-end pr-0.5">
          <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#E05252]" />
          <span className="text-[11px] text-[#E05252]">
            Seen · not replied.
          </span>
        </div>
      </div>
    </div>
  );

  const card3 = (
    <div
      className="border-l-[3px] border-l-[#E05252] px-7 py-6"
      style={{ ...cardBase, border: "1px solid #333333" }}
    >
      <div className="font-jost mb-3 text-[10px] tracking-[0.12em] text-[#888888]">
        ORIGINAL PRICE
      </div>
      <div className="font-serif mb-2 text-lg text-[#555555] line-through">
        £10.00
      </div>
      <div className="mb-2 text-lg text-gold">↑</div>
      <div className="font-serif mb-2.5 text-[clamp(36px,4vw,50px)] leading-none font-bold text-cream">
        £30.00
      </div>
      <div className="font-jost text-[10px] tracking-[0.12em] text-[#888888]">
        RESALE ON VIAGOGO
      </div>
    </div>
  );

  return (
    <section
      ref={sectionRef}
      className="flex min-h-screen flex-col justify-center bg-void px-[5%] py-10 sm:py-12"
    >
      <div
        className="font-jost mb-9 text-[11px] font-medium tracking-[0.14em] text-gold uppercase"
        style={{
          opacity: visible ? 1 : 0,
          transition: "opacity 400ms ease",
        }}
      >
        SOUND FAMILIAR?
      </div>

      <ProblemRow
        textLeft
        borderTop={false}
        headline={"YOU BOUGHT EARLY.\nNOW YOU CAN'T GO.\nTHE TICKET'S WORTHLESS."}
        card={card1}
        rowStyle={rowStyle(0)}
        isMobile={isMobile}
      />
      <ProblemRow
        textLeft={false}
        borderTop
        headline={"YOU FOUND SOMEONE\nSELLING ON FACEBOOK.\nYOU HOPE IT'S REAL."}
        card={card2}
        rowStyle={rowStyle(120)}
        isMobile={isMobile}
      />
      <ProblemRow
        textLeft
        borderTop
        headline={
          "YOU'RE LOOKING AT A\nVIAGOGO LISTING AT\nTHREE TIMES THE\nORIGINAL PRICE."
        }
        card={card3}
        rowStyle={rowStyle(240)}
        isMobile={isMobile}
      />
    </section>
  );
}
