import Link from "next/link";
import { auth } from "@/auth";
import { signOut } from "@/auth";

export default async function PageHeader() {
  const session = await auth();

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-purple-300/80">
          <span className="h-px w-10 bg-linear-to-r from-purple-500 to-blue-400" />
          Organizer Admin Panel
        </div>
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">
          Create and publish your next event
        </h1>
        <p className="max-w-2xl text-sm text-zinc-400">
          Build a premium experience with dynamic pricing, flexible ticket
          batches, and live revenue insights.
        </p>
        {session && (
          <p className="mt-2 text-sm text-zinc-500">
            Logged in as{" "}
            <span className="text-purple-300">{session.user.name}</span>
            {session.user.role === "admin" && (
              <span className="ml-2 rounded-full border border-purple-500/40 bg-purple-500/10 px-2 py-0.5 text-xs text-purple-300">
                Admin
              </span>
            )}
          </p>
        )}
      </div>
      <div className="flex gap-2">
        {session?.user.role === "admin" && (
          <Link
            href="/admin/users"
            className="rounded-xl border border-white/10 bg-zinc-900 px-4 py-2 text-sm text-zinc-200 transition hover:border-white/20 hover:bg-zinc-800"
          >
            Manage Users
          </Link>
        )}
        <Link
          href="/events"
          className="rounded-xl border border-white/10 bg-zinc-900 px-4 py-2 text-sm text-zinc-200 transition hover:border-white/20 hover:bg-zinc-800"
        >
          View All Events
        </Link>
        {session && (
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm text-rose-300 transition hover:bg-rose-500/20"
            >
              Sign Out
            </button>
          </form>
        )}
      </div>
    </header>
  );
}
