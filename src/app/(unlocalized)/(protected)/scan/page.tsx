import PageHeadline from "@/app/_components/ui/PageHeadline";
import OuterPage from "@/app/_components/ui/OuterPage";
import { fetchEventsFromCms } from "@/domain/cms/operations/fetchEventsFromCms";
import { isEventCompleted } from "@/domain/event/businessLogic";
import Link from "next/link";
import ImageWithFallback from "@/app/_components/content/ImageWithFallback";
import { formatEventDateAndTime } from "@/lib/util/formatting";
import type { Metadata } from "next";
import clsx from "clsx";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("scan.scanner");
  return {
    title: t("title"),
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function ScanPage() {
  const t = await getTranslations("scan.scanner");
  const eventsToScan = await fetchEventsFromCms({});

  const eventsToDisplay = eventsToScan?.filter(event => {
    return !isEventCompleted(event);
  });

  // Auto-redirect if there's only one scannable event
  const scannableEvents = eventsToDisplay?.filter(
    event => event.options.enabledTicketScanning
  );
  if (scannableEvents?.length === 1) {
    redirect(`/scan/${scannableEvents[0].uid}`);
  }

  return (
    <OuterPage>
      <PageHeadline
        title={t("title")}
        segments={[
          { label: "Endemit", path: "" },
          { label: t("breadcrumb"), path: "scan" },
        ]}
      />
      <div className="px-4 py-6 sm:px-0">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {t("heading")}
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              {t("intro")}
            </p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
            {eventsToDisplay &&
              eventsToDisplay.map(event => (
                <div
                  key={`event-card-scanner-${event.id}`}
                  className="border-t first:border-none border-gray-200 px-4 py-5 sm:px-6 flex gap-x-6"
                >
                  <ImageWithFallback
                    src={event.coverImage?.src}
                    alt={event.coverImage?.alt ?? ""}
                    placeholder={event.coverImage?.placeholder}
                    width={100}
                    height={100}
                    className={"aspect-square object-fill w-20"}
                  />

                  <Link
                    key={event.id}
                    href={`/scan/${event.uid}`}
                    className="text-2xl"
                  >
                    {event.name}
                    {event.date_start && (
                      <span className={"block text-sm"}>
                        {formatEventDateAndTime(event.date_start)}
                      </span>
                    )}
                    <span
                      className={clsx(
                        "block text-sm mt-1",
                        event.options.enabledTicketScanning && "text-green-600",
                        !event.options.enabledTicketScanning && "text-red-600"
                      )}
                    >
                      {event.options.enabledTicketScanning
                        ? t("scanningEnabled")
                        : t("scanningDisabled")}
                    </span>
                  </Link>
                </div>
              ))}

            {!eventsToDisplay ||
              (eventsToDisplay.length === 0 && (
                <div
                  className={
                    "p-4 text-sm text-center min-h-40 flex flex-col justify-center items-center"
                  }
                >
                  <div>{t("noEvents")}</div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </OuterPage>
  );
}
