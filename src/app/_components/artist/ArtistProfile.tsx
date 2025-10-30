import Link from "next/link";
import { RichTextField } from "@prismicio/client";
import RichTextDisplay from "@/app/_components/content/RichTextDisplay";
import AnimatedEndemitLogo from "@/app/_components/icon/AnimatedEndemitLogo";
import ImageWithFallback from "@/app/_components/content/ImageWithFallback";
import { CmsImage } from "@/domain/cms/types/common";
import { getResizedPrismicImage } from "@/lib/util/util";

interface ArtistLink {
  url: string;
  type: string;
}

interface Artist {
  uid: string;
  name: string;
  description?: RichTextField | null;
  image: CmsImage | null;
  links: ArtistLink[] | null;
  isEndemitCrew?: boolean;
}

interface PodcastArtistSectionProps {
  artist: Artist;
  coverSrc?: string;
  showLinkToPage?: boolean;
}

export default function ArtistProfile({
  artist,
  coverSrc,
  showLinkToPage = false,
}: PodcastArtistSectionProps) {
  return (
    <div className="relative overflow-hidden mb-40">
      <div className="flex gap-x-12 max-lg:flex-col max-lg:gap-y-16 max-lg:items-center">
        {artist.image && (
          <div>
            <ImageWithFallback
              src={artist.image.src}
              alt={artist.image.alt ?? artist.name}
              placeholder={artist.image.placeholder}
              width={300}
              height={300}
              quality={90}
              className="rounded-md object-cover max-sm:w-full"
            />
          </div>
        )}
        <div className="flex-1">
          <div className="bg-gradient-to-b from-neutral-300 to-neutral-400 bg-clip-text text-transparent relative">
            <h1
              className="text-5xl lg:text-7xl 2xl:text-8xl font-bold text-transparent bg-clip-text blur-[5px] top-0 absolute scale-110"
              style={
                coverSrc
                  ? {
                      backgroundImage: `url('${getResizedPrismicImage(coverSrc, { width: 400, quality: 50 })}')`,
                      backgroundSize: "1000px",
                      backgroundRepeat: "repeat",
                    }
                  : {}
              }
            >
              {artist.name}
            </h1>
            <h2 className="text-5xl lg:text-7xl 2xl:text-8xl  text-neutral-300 relative">
              {artist.name}
            </h2>
            {artist.isEndemitCrew && (
              <div
                className={" w-full  flex gap-x-1 relative z-10 items-center"}
              >
                <div className={"uppercase font-heading pt-2 text-neutral-500"}>
                  Part of
                </div>{" "}
                <div className={"w-20 text-neutral-300"}>
                  <AnimatedEndemitLogo />
                </div>
                <div className={"px-2 text-neutral-500"}>·</div>
                <div>
                  <Link
                    href={`mailto:endemit@endemit.org?subject=Booking endemit artist: ${artist.name}`}
                    className={"link text-[#d31c18] hover:text-[#87100e]"}
                  >
                    Inquire about booking
                  </Link>
                </div>
              </div>
            )}
            {artist.description && (
              <div className={"mt-6"}>
                <RichTextDisplay richText={artist.description} />
              </div>
            )}
          </div>
          {showLinkToPage && (
            <div className={"mt-6"}>
              <Link
                href={`/artists/${artist.uid}`}
                className={"link text-[#d31c18] hover:text-[#87100e]"}
              >
                View {artist.name}&#39;s full profile
              </Link>
            </div>
          )}
          {artist.links && artist.links.length > 0 && (
            <div className="gap-y-2 gap-x-6 flex mt-6 max-xl:flex-col">
              <div className="text-neutral-300 text-sm">
                Find {artist.name} on:
              </div>
              {artist.links.map((link, index) => (
                <div key={`artist-link-${index}`}>
                  <Link
                    href={link.url}
                    target="_blank"
                    className="link text-[#d31c18] hover:text-[#87100e]"
                  >
                    {link.type}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
