export default function MobilePublishFooter() {
  return (
    <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-40 bg-linear-to-t from-[#0f0f0f] via-[#0f0f0f]/80 to-transparent pb-6 pt-12 sm:hidden">
      <div className="pointer-events-auto mx-auto w-full max-w-sm px-4">
        <button
          type="submit"
          form="event-form"
          className="w-full rounded-xl bg-linear-to-r from-indigo-500 via-purple-500 to-blue-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/30"
        >
          Publish Event
        </button>
      </div>
    </div>
  );
}
