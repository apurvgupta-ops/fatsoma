import type { ToastState } from "@/types/event-form";

type Props = {
  toast: ToastState;
};

export default function Toast({ toast }: Props) {
  if (!toast) return null;

  return (
    <div className="fixed right-6 top-6 z-50 rounded-2xl border border-white/10 bg-zinc-950/90 px-4 py-3 text-sm shadow-xl">
      <p
        className={`font-medium ${
          toast.type === "success" ? "text-emerald-300" : "text-rose-300"
        }`}
      >
        {toast.message}
      </p>
    </div>
  );
}
