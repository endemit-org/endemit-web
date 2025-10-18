import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import TicketIcon from "@/components/icon/TicketIcon";

export interface EventProps {
  id: string;
  title: string;
  annotation?: string;
  dateString: string;
  location: string;
  artists: string[];
  imageSrc?: string;
  href?: string;
  children?: React.ReactNode;
  options?: {
    isPastEvent?: boolean;
    isTicketsAvailable?: boolean;
    openInNewTab?: boolean;
  };
  visible: {
    link: boolean;
    event: boolean;
    image: boolean;
  };
}

export default function EventCard({
  artists,
  title,
  dateString,
  location,
  annotation,
  imageSrc,
  href,
  children,
  options,
  visible: { link: linkVisible, image: imageVisible },
}: EventProps) {
  const shouldShowLink = linkVisible && href;
  const shouldShowImage = imageVisible && imageSrc;

  return (
    <div className={clsx(!shouldShowLink && "cursor-not-allowed")}>
      <Link
        href={shouldShowLink ? href : ""}
        target={href?.startsWith("http") ? "_blank" : "_self"}
        className={clsx(
          "block focus:outline-0 active:outline-0 mt-2 hover:scale-[1.02] transition-all duration-300 active:scale-[0.995]",
          !shouldShowLink && "pointer-events-none"
        )}
      >
        <div className={clsx("pt-4 pb-6 min-h-[220px] md:h-[220px]")}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 h-full">
            {shouldShowImage && (
              <div className="relative h-48 md:h-full overflow-hidden rounded-md aspect-[2/1]">
                <Image
                  src={imageSrc}
                  alt={title}
                  fill
                  className="object-cover"
                />
                {children}
              </div>
            )}
            {!shouldShowImage && (
              <div>
                <div
                  className="w-full h-48 md:h-full flex items-center justify-center bg-stone-700 rounded-md  "
                  style={{
                    backgroundImage: "url('/images/worms.png')",
                    backgroundRepeat: "repeat",
                    backgroundBlendMode: "color-burn",
                    backgroundSize: "40%",
                  }}
                >
                  <div className="text-center">
                    <Image
                      src={"/images/endemit-logo.png"}
                      alt={"Event image coming soon"}
                      width={48}
                      height={48}
                      className="mx-auto mb-2 opacity-70 "
                    />
                    <div className="text-stone-400 font-medium">
                      Details coming soon
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="flex flex-col justify-center">
              <h3 className="text-xl md:text-2xl font-bold mb-2 text-white uppercase">
                {title}
                {annotation && (
                  <span className="text-sm md:text-base font-normal text-gray-400 ml-2">
                    {annotation}
                  </span>
                )}
              </h3>
              <p className="text-gray-400 mb-3 text-sm">
                {dateString} • {location}
              </p>
              {artists && (
                <div className="text-md md:text-lg text-gray-400 font-heading">
                  {artists.map(
                    (artist, index) => `${index > 0 ? " • " : ""}${artist}`
                  )}
                </div>
              )}
              {options?.isTicketsAvailable && (
                <div className="mt-4">
                  <span className="px-2 py-1 bg-white text-black animate-pulse text-md rounded-md flex w-fit gap-x-2 items-center">
                    <TicketIcon />
                    Tickets now available
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
