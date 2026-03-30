import EventMiniCard from "@/app/_components/event/EventMiniCard";

interface EventData {
  id: string;
  uid: string;
  name: string;
  dateStart: Date | null;
  dateEnd: Date | null;
  image: { src: string; alt: string | null; placeholder: string } | null;
  link: string;
}

interface ProfileEventsAttendedProps {
  events: EventData[];
}

export default function ProfileEventsAttended({
  events,
}: ProfileEventsAttendedProps) {
  if (events.length === 0) {
    return null;
  }

  return (
    <div className="bg-neutral-900 rounded-lg overflow-hidden ">
      <div className="p-4 border-b border-neutral-700">
        <h3 className="text-lg font-semibold text-neutral-200">
          Events Attended
        </h3>
        <p className="text-sm text-neutral-400 mt-1">
          {events.length} {events.length === 1 ? "event" : "events"}
        </p>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map(event => (
            <EventMiniCard
              key={event.id}
              name={event.name}
              dateStart={event.dateStart}
              dateEnd={event.dateEnd}
              image={event.image}
              link={event.link || null}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
