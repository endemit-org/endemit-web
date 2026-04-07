"use client";

import { useState } from "react";

interface ScannerTabsProps {
  scannerContent: React.ReactNode;
  doorSaleContent: React.ReactNode;
  showDoorSale: boolean;
}

export default function ScannerTabs({
  scannerContent,
  doorSaleContent,
  showDoorSale,
}: ScannerTabsProps) {
  const [activeTab, setActiveTab] = useState<"scanner" | "doorsale">("scanner");

  if (!showDoorSale) {
    return <>{scannerContent}</>;
  }

  return (
    <div>
      {/* Tab navigation */}
      <div className="flex border-b border-neutral-600 mb-4">
        <button
          onClick={() => setActiveTab("scanner")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "scanner"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-neutral-400 hover:text-neutral-200"
          }`}
        >
          Scanner
        </button>
        <button
          onClick={() => setActiveTab("doorsale")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "doorsale"
              ? "border-green-500 text-green-400"
              : "border-transparent text-neutral-400 hover:text-neutral-200"
          }`}
        >
          Door Sales
        </button>
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "scanner" && scannerContent}
        {activeTab === "doorsale" && doorSaleContent}
      </div>
    </div>
  );
}
