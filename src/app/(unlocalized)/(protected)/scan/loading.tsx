import PageHeadline from "@/app/_components/ui/PageHeadline";
import OuterPage from "@/app/_components/ui/OuterPage";

export default function ScanLoading() {
  return (
    <OuterPage>
      <PageHeadline
        title="Ticket scanner"
        segments={[
          { label: "Endemit", path: "" },
          { label: "Scan", path: "scan" },
        ]}
      />
      <div className="px-4 py-6 sm:px-0">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg animate-pulse">
          <div className="px-4 py-5 sm:px-6">
            <div className="h-6 w-48 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-80 bg-gray-100 rounded" />
          </div>
          <div className="border-t border-gray-200">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="border-t first:border-none border-gray-200 px-4 py-5 sm:px-6 flex gap-x-6"
              >
                <div className="w-20 h-20 bg-gray-200 rounded flex-shrink-0" />
                <div>
                  <div className="h-7 w-48 bg-gray-200 rounded mb-2" />
                  <div className="h-4 w-36 bg-gray-100 rounded mb-2" />
                  <div className="h-4 w-32 bg-green-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </OuterPage>
  );
}
