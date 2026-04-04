import Link from "next/link";
import ImageWithFallback from "@/app/_components/content/ImageWithFallback";
import { formatEventDate } from "@/lib/util/formatting";

interface EventData {
  id: string;
  uid: string;
  name: string;
  dateStart: Date | null;
  dateEnd: Date | null;
  image: { src: string; alt: string | null; placeholder: string } | null;
  link: string;
  hasTicketsAvailable: boolean;
}

interface ProfileUpcomingEventsPromoProps {
  events: EventData[];
}

export default function ProfileUpcomingEventsPromo({
  events,
}: ProfileUpcomingEventsPromoProps) {
  if (events.length === 0) {
    return null;
  }

  return (
    <div className="bg-neutral-900 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-blue-700/30">
        <h3 className="text-lg font-semibold text-neutral-200">
          Upcoming Events
        </h3>
        <p className="text-sm text-neutral-400 mt-1">
          Don&apos;t miss out - get your tickets!
        </p>
      </div>

      <div className="p-4 space-y-3">
        {events.map(event => (
          <Link
            key={event.id}
            href={event.link}
            className="flex gap-4 p-3 bg-neutral-900/50 hover:bg-neutral-800/50 rounded-lg transition-colors group"
          >
            {event.image && (
              <div className="w-16 h-16 flex-shrink-0 rounded-md overflow-hidden">
                <ImageWithFallback
                  src={event.image.src}
                  alt={event.image.alt ?? event.name}
                  placeholder={event.image.placeholder}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-neutral-200 truncate group-hover:text-white transition-colors">
                {event.name}
              </h4>
              {event.dateStart && event.dateEnd && (
                <p className="text-sm text-neutral-400 mt-0.5">
                  {formatEventDate(event.dateStart, event.dateEnd)}
                </p>
              )}
              {event.hasTicketsAvailable && (
                <span className="inline-block mt-1.5 text-xs font-medium text-green-400 bg-green-400/10 px-2 py-0.5 rounded">
                  Tickets Available
                </span>
              )}
            </div>
            <div className="flex items-center text-neutral-500 group-hover:text-neutral-300 transition-colors">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
