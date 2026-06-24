"use client";

const ATOMIC_STEPS = [
  { n: "1", title: "Payment confirmed." },
  { n: "2", title: "Previous ticket invalidated." },
  { n: "3", title: "Fresh QR issued to you." },
];

const QR_PATTERN = [
  [1, 1, 0, 1, 1],
  [1, 0, 0, 0, 1],
  [0, 1, 1, 1, 0],
  [1, 0, 0, 0, 1],
  [1, 1, 0, 1, 1],
];

export default function AtomicTransferSection() {
  return (
    <section className="relative z-[2] border-t border-[#1A1A1A] bg-[#080808] px-6 py-[60px] sm:px-12">
      <div className="mx-auto max-w-[900px]">
        <p className="font-jost m-0 mb-12 text-center text-[11px] tracking-[0.2em] text-gold uppercase">
          EVERY TRANSFER IS ATOMIC
        </p>

        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-[60px]">
          <div>
            {ATOMIC_STEPS.map((step, i) => (
              <div key={step.n}>
                <div className="flex items-center gap-4">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold font-jost text-[13px] font-bold text-black">
                    {step.n}
                  </div>
                  <h4 className="m-0 text-base font-semibold text-cream">
                    {step.title}
                  </h4>
                </div>
                {i < ATOMIC_STEPS.length - 1 && (
                  <div className="my-1 ml-[13px] h-8 border-l border-[rgba(201,168,76,0.25)]" />
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-4">
            <PhoneQR voided />
            <div className="relative flex w-10 shrink-0 flex-col items-center justify-center">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#C9A84C"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
              <div className="unbuy-travel-dot absolute h-1.5 w-1.5 rounded-full bg-gold" />
            </div>
            <PhoneQR active />
          </div>
        </div>
      </div>
    </section>
  );
}

function PhoneQR({ voided, active }: { voided?: boolean; active?: boolean }) {
  return (
    <div
      className={`flex h-[220px] w-[130px] flex-col items-center justify-center rounded-[20px] border bg-[#1A1A1A] p-4 ${
        active
          ? "animate-[phonePulse_2s_ease-in-out_infinite] border-[rgba(201,168,76,0.5)]"
          : "border-[#333333]"
      }`}
    >
      <div
        className="grid grid-cols-5 gap-0.5"
        style={{
          filter: voided ? "blur(1px)" : "none",
          opacity: voided ? 0.4 : 1,
        }}
      >
        {QR_PATTERN.flatMap((row, r) =>
          row.map((v, c) => (
            <div
              key={`${r}-${c}`}
              className="h-2.5 w-2.5 rounded-[1px]"
              style={{
                background: v ? (active ? "#C9A84C" : "#555555") : "transparent",
              }}
            />
          )),
        )}
      </div>
      <p
        className={`mt-3.5 text-[11px] font-bold tracking-[0.1em] uppercase ${
          voided ? "text-[#E05252]" : "text-gold"
        }`}
      >
        {voided ? "VOID" : "ACTIVE"}
      </p>
    </div>
  );
}
