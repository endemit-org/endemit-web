"use client";

import { useTranslations } from "next-intl";

export default function MapLoadingPlaceholder() {
  const t = useTranslations("events");

  return (
    <div className="w-full h-[400px] bg-neutral-800 animate-pulse flex items-center justify-center text-neutral-500">
      {t("location.loadingMap")}
    </div>
  );
}
