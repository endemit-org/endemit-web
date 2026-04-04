import PageHeadline from "@/app/_components/ui/PageHeadline";

export default function EventScanLoading() {
  return (
    <>
      <PageHeadline
        title="Loading..."
        segments={[
          { label: "Endemit", path: "" },
          { label: "Scan", path: "scan" },
          { label: "...", path: "" },
        ]}
      />
      <div className="flex flex-col gap-y-8 mt-12 animate-pulse">
        {/* Event Header */}
        <div className="p-4 bg-neutral-800 flex gap-4 gap-x-8 rounded">
          <div className="w-[200px] h-[200px] bg-neutral-700 rounded flex-shrink-0" />
          <div className="flex-1">
            <div className="h-7 w-48 bg-neutral-700 rounded mb-2" />
            <div className="h-5 w-64 bg-neutral-700/70 rounded mb-6" />
            <div className="h-4 w-40 bg-neutral-700/50 rounded mb-10" />
            <div className="h-12 w-48 bg-neutral-700 rounded" />
          </div>
        </div>

        {/* Tickets Table */}
        <div className="bg-neutral-800 rounded-lg overflow-hidden">
          {/* Search/Filter bar */}
          <div className="p-4 border-b border-neutral-700 flex gap-4">
            <div className="h-10 flex-1 max-w-md bg-neutral-700 rounded" />
            <div className="h-10 w-32 bg-neutral-700 rounded" />
          </div>

          {/* Table header */}
          <div className="px-4 py-3 bg-neutral-900 border-b border-neutral-700 flex gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-4 w-24 bg-neutral-700 rounded" />
            ))}
          </div>

          {/* Table rows */}
          {[1, 2, 3, 4, 5].map(i => (
            <div
              key={i}
              className="px-4 py-4 border-b border-neutral-700/50 flex items-center gap-4"
            >
              <div className="h-4 w-20 bg-neutral-700 rounded" />
              <div className="h-4 w-32 bg-neutral-700 rounded" />
              <div className="h-4 w-48 bg-neutral-700 rounded" />
              <div className="h-6 w-16 bg-neutral-700 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
