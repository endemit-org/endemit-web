import { fetchEventFromCmsByUid } from "@/domain/cms/operations/fetchEventFromCms";
import { notFound } from "next/navigation";
import {
  isEventCompleted,
  isEventScanningEnabled,
} from "@/domain/event/businessLogic";
import { getTicketsForEvent } from "@/domain/ticket/operations/getTicketsForEvent";
import PageHeadline from "@/app/_components/ui/PageHeadline";
import { formatEventDateAndTime } from "@/lib/util/formatting";
import QRScanner from "@/app/_components/ticket/QrScanner";
import ImageWithFallback from "@/app/_components/content/ImageWithFallback";
import TicketsDisplay from "@/app/_components/ticket/TicketDisplay";
import { serializeTicket } from "@/domain/ticket/util";

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
        <div className={"p-4 bg-neutral-800 flex gap-4 gap-x-8 rounded"}>
          <div>
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
            <div className="mt-10">
              {showScanner && <QRScanner eventId={event.id} />}
              {!showScanner && <div>Scanning is not enabled</div>}
            </div>
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
