import dynamic from "next/dynamic";
import { fetchEventFromCmsByUid } from "@/domain/cms/operations/fetchEventFromCms";
import { notFound } from "next/navigation";
import {
  isEventCompleted,
  isEventDoorSaleAvailable,
  isEventScanningEnabled,
} from "@/domain/event/businessLogic";
import { getTicketsForEvent } from "@/domain/ticket/operations/getTicketsForEvent";
import PageHeadline from "@/app/_components/ui/PageHeadline";
import { formatEventDateAndTime } from "@/lib/util/formatting";
import ImageWithFallback from "@/app/_components/content/ImageWithFallback";
import TicketsDisplay from "@/app/_components/ticket/TicketDisplay";
import { serializeTicket } from "@/domain/ticket/util";
import ScannerTabs from "@/app/_components/ticket/ScannerTabs";
import DoorSaleForm from "@/app/_components/ticket/DoorSaleForm";

// Dynamic import: QR Scanner (~120KB) only loads on scan pages
const QRScanner = dynamic(
  () => import("@/app/_components/ticket/QrScanner")
);

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{
    uid: string;
  }>;
}) {
  const { uid } = await params;
  const event = await fetchEventFromCmsByUid(uid);

  if (!event) {
    notFound();
  }

  const title = `${event.meta.title ?? event.name} • Scanner`;

  return {
    title,
  };
}

export default async function EventScanPage({
  params,
}: {
  params: Promise<{
    uid: string;
  }>;
}) {
  const { uid } = await params;
  const event = await fetchEventFromCmsByUid(uid);

  if (!event) {
    notFound();
  }

  const isInFuture = !isEventCompleted(event);
  const isScanningEnabled = isEventScanningEnabled(event);
  const showScanner = isScanningEnabled && isInFuture;
  const showDoorSale = isEventDoorSaleAvailable(event);

  const initialTickets = await getTicketsForEvent(event.id);
  const serializedTickets = initialTickets.map(ticket =>
    serializeTicket(ticket)
  );

  return (
    <>
      <PageHeadline
        title={event.name}
        segments={[
          { label: "Endemit", path: "" },
          { label: "Scan", path: "scan" },
          { label: event.name, path: event.uid },
        ]}
      />
      <div className="flex flex-col gap-y-8 mt-12">
        <div className={"p-4 bg-neutral-800 flex flex-col md:flex-row gap-4 gap-x-8 rounded"}>
          <div className="flex gap-4 gap-x-8">
            <div className="shrink-0">
              <ImageWithFallback
                src={event.coverImage?.src}
                alt={event.coverImage?.alt ?? ""}
                placeholder={event.coverImage?.placeholder}
                width={200}
                height={200}
                className={"aspect-square object-fill"}
              />
            </div>
            <div className={"text-neutral-300"}>
              <div className="font-semibold text-lg">{event.name}</div>
              <div>
                <strong>{event.venue?.name}, </strong>
                {event.date_start && formatEventDateAndTime(event.date_start)}
              </div>
              <div className={"uppercase mt-6 font-bold"}>
                {event.artists.map(artist => artist.name).join(" · ")}
              </div>
              <div className="mt-10 hidden md:block">
                <ScannerTabs
                  showDoorSale={showDoorSale}
                  scannerContent={
                    showScanner ? (
                      <QRScanner eventId={event.id} />
                    ) : (
                      <div>Scanning is not enabled</div>
                    )
                  }
                  doorSaleContent={
                    showDoorSale && (
                      <DoorSaleForm
                        eventId={event.id}
                        eventName={event.name}
                        cashTicketPrice={event.cashTicketPrice!}
                      />
                    )
                  }
                />
              </div>
            </div>
          </div>
          <div className="md:hidden w-full">
            <ScannerTabs
              showDoorSale={showDoorSale}
              scannerContent={
                showScanner ? (
                  <QRScanner eventId={event.id} />
                ) : (
                  <div>Scanning is not enabled</div>
                )
              }
              doorSaleContent={
                showDoorSale && (
                  <DoorSaleForm
                    eventId={event.id}
                    eventName={event.name}
                    cashTicketPrice={event.cashTicketPrice!}
                  />
                )
              }
            />
          </div>
        </div>

        <TicketsDisplay
          eventId={event.id}
          scanningEnabled={event.options.enabledTicketScanning}
          initialTickets={serializedTickets}
          shouldAutoRefresh={showScanner}
          refreshInterval={30}
        />
      </div>
    </>
  );
}
