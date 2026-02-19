import EventCreateForm from "@/components/admin/EventCreateForm";
import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";

export default async function Home() {
  return (
    <AuthenticatedLayout>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-16 pt-12 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4">
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
          </div>
        </header>
        <EventCreateForm />
      </div>
    </AuthenticatedLayout>
  );
}
