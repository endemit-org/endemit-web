import Link from "next/link";
import Image from "next/image";
import { formatDate } from "@/lib/util/formatting";

interface PodcastCardProps {
  image?: {
    src: string;
    alt?: string | null;
  } | null;
  name: string;
  date: Date | null;
  episodeNumber: string;
  uid: string;
}

export default function PodcastCard({
  uid,
  episodeNumber,
  date,
  name,
  image,
}: PodcastCardProps) {
  return (
    <div
      className={
        "group bg-neutral-950 p-2 hover:bg-black rounded-sm text-left w-full"
      }
    >
      <Link href={`/music/emit/${uid}`}>
        <div className={"aspect-square overflow-hidden "}>
          {image && (
            <Image
              src={image.src}
              alt={image.alt ?? name}
              width={800}
              height={800}
              loading="lazy"
              className="aspect-square w-full   object-cover  group-hover:grayscale xl:aspect-7/8 transition-all ease-in-out"
            />
          )}
        </div>

        <div className={"flex my-4 w-full px-2"}>
          <div className={"flex-1"}>
            <h3 className="text-2xl text-neutral-200">{name}</h3>
            <p className="text-sm ">
              <span className={"text-red-500"}>{episodeNumber}</span>
              {" • "}
              {date && (
                <span className={"text-neutral-200"}>{formatDate(date)}</span>
              )}
            </p>
          </div>
        </div>
      </Link>
    </div>
  );
}
