import React from "react";
import VenueCard from "@/app/_components/venue/VenueCard";
import { Venue } from "@/domain/venue/types/venue";

interface Props {
  title?: string;
  venues: Venue[];
}

export default function VenueLister({ title, venues }: Props) {
  return (
    <>
      {title && (
        <h1 className="text-3xl lg:text-5xl font-bold text-neutral-200 mb-8 relative z-10">
          {title}
        </h1>
      )}
      <div
        className={
          "grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 relative z-10"
        }
      >
        {venues.map((venue, index) => (
          <React.Fragment key={`${venue.id}-${index}`}>
            <VenueCard
              name={venue.name}
              image={venue.image}
              link={`/venues/${venue.uid}`}
              location={venue.address ?? ""}
            />
          </React.Fragment>
        ))}
      </div>
    </>
  );
}
