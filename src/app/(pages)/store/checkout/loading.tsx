import OuterPage from "@/app/_components/ui/OuterPage";
import PageHeadline from "@/app/_components/ui/PageHeadline";

function CheckoutSkeleton() {
  return (
    <div className="max-w-6xl mx-auto animate-pulse">
      <div className="grid lg:grid-cols-[1fr,400px] gap-8">
        {/* Left side - Form */}
        <div className="space-y-6">
          {/* Items section */}
          <div className="bg-neutral-800 rounded-lg p-6">
            <div className="h-6 w-32 bg-neutral-700 rounded mb-4" />
            <div className="space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="flex gap-4">
                  <div className="w-20 h-20 bg-neutral-700 rounded" />
                  <div className="flex-1">
                    <div className="h-5 w-40 bg-neutral-700 rounded mb-2" />
                    <div className="h-4 w-24 bg-neutral-700/70 rounded mb-2" />
                    <div className="h-4 w-16 bg-neutral-700/70 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer form section */}
          <div className="bg-neutral-800 rounded-lg p-6">
            <div className="h-6 w-40 bg-neutral-700 rounded mb-4" />
            <div className="space-y-4">
              <div className="h-12 bg-neutral-700 rounded" />
              <div className="h-12 bg-neutral-700 rounded" />
            </div>
          </div>

          {/* Payment section */}
          <div className="bg-neutral-800 rounded-lg p-6">
            <div className="h-6 w-32 bg-neutral-700 rounded mb-4" />
            <div className="h-12 bg-neutral-700 rounded" />
          </div>
        </div>

        {/* Right side - Summary */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="bg-neutral-900 rounded-lg p-6">
            <div className="h-6 w-28 bg-neutral-800 rounded mb-6" />

            <div className="space-y-3 mb-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex justify-between">
                  <div className="h-4 w-20 bg-neutral-800 rounded" />
                  <div className="h-4 w-16 bg-neutral-800 rounded" />
                </div>
              ))}
            </div>

            <div className="border-t border-neutral-700 pt-4 mb-6">
              <div className="flex justify-between">
                <div className="h-6 w-16 bg-neutral-800 rounded" />
                <div className="h-6 w-20 bg-neutral-800 rounded" />
              </div>
            </div>

            <div className="h-12 bg-neutral-700 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutLoading() {
  return (
    <OuterPage>
      <PageHeadline
        title="Checkout"
        segments={[
          { label: "Endemit", path: "" },
          { label: "Store", path: "store" },
          { label: "Checkout", path: "checkout" },
        ]}
      />
      <CheckoutSkeleton />
    </OuterPage>
  );
}
