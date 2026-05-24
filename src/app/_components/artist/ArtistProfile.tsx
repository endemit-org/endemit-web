import Link from "next/link";
import { isFilled, RichTextField } from "@prismicio/client";
import RichTextDisplay from "@/app/_components/content/RichTextDisplay";
import AnimatedEndemitLogo from "@/app/_components/icon/AnimatedEndemitLogo";
import ImageWithFallback from "@/app/_components/content/ImageWithFallback";
import { CmsImage } from "@/domain/cms/types/common";
import { getResizedPrismicImage } from "@/lib/util/util";
import Image from "next/image";

interface ArtistLink {
  url: string;
  type: string;
}

interface Artist {
  uid: string;
  name: string;
  description?: RichTextField | null;
  image: CmsImage | null;
  video?: string | null;
  links: ArtistLink[] | null;
  isEndemitCrew?: boolean;
}

interface PodcastArtistSectionProps {
  artist: Artist;
  coverSrc?: string;
  showLinkToPage?: boolean;
  imageOverride?: CmsImage | null;
  nameOverride?: string | null;
  descriptionOverride?: RichTextField | null;
  videoOverride?: string | null;
}

export default function ArtistProfile({
  artist,
  coverSrc,
  showLinkToPage = false,
  imageOverride,
  nameOverride,
  descriptionOverride,
  videoOverride,
}: PodcastArtistSectionProps) {
  const image = imageOverride ?? artist.image;
  const cover = imageOverride?.src ?? coverSrc;
  const name = nameOverride || artist.name;
  const description = isFilled.richText(descriptionOverride ?? [])
    ? descriptionOverride
    : artist.description;
  const video = videoOverride ?? artist.video ?? null;

  return (
    <div className="relative overflow-hidden mb-40 z-10">
      <div className="flex gap-x-12 max-lg:flex-col max-lg:gap-y-16 max-lg:items-center">
        {(image || video) && (
          <div className="flex flex-col gap-y-4">
            {image && (
              <ImageWithFallback
                src={image.src}
                alt={image.alt ?? name}
                placeholder={image.placeholder}
                width={300}
                height={300}
                quality={90}
                className="rounded-md object-cover max-sm:w-full"
              />
            )}
            {video && (
              <video
                src={video}
                loop
                muted
                autoPlay
                playsInline
                className="rounded-md w-[300px] max-sm:w-full aspect-square object-cover"
              />
            )}
          </div>
        )}
        <div className="flex-1">
          <div className="bg-gradient-to-b from-neutral-300 to-neutral-400 bg-clip-text text-transparent relative">
            <h1
              className="text-5xl lg:text-7xl 2xl:text-8xl font-bold text-transparent bg-clip-text blur-[5px] top-0 absolute scale-110 uppercase"
              style={
                cover
                  ? {
                      backgroundImage: `url('${getResizedPrismicImage(cover, { width: 400, quality: 50 })}')`,
                      backgroundSize: "1000px",
                      backgroundRepeat: "repeat",
                    }
                  : {}
              }
            >
              {name}
            </h1>
            <h2 className="text-5xl lg:text-7xl 2xl:text-8xl  text-neutral-300 relative uppercase">
              {name}
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
                    href={`mailto:endemit@endemit.org?subject=Booking endemit artist: ${name}`}
                    className={"link text-[#d31c18] hover:text-[#87100e]"}
                  >
                    Inquire about booking
                  </Link>
                </div>
              </div>
            )}
            {description && (
              <div className={"mt-6"}>
                <RichTextDisplay richText={description} />
              </div>
            )}
          </div>
          {showLinkToPage && (
            <div className={"mt-6"}>
              <Link
                href={`/artists/${artist.uid}`}
                className={"link text-[#d31c18] hover:text-[#87100e]"}
              >
                View {name}&#39;s full profile
              </Link>
            </div>
          )}
          {artist.links && artist.links.length > 0 && (
            <div className="gap-y-2 gap-x-6 flex mt-6 max-xl:flex-col">
              <div className="text-neutral-300 text-sm">
                Find {name} on:
              </div>
              {artist.links.map((link, index) => (
                <div key={`artist-link-${index}`}>
                  <Link
                    href={link.url}
                    target="_blank"
                    className="link text-[#d31c18] hover:text-[#87100e] flex gap-x-2 lg:justify-center"
                  >
                    <Image
                      src={`/images/${link.type.toLowerCase().replace(" ", "")}.png`}
                      alt={`${name} ${link.type}`}
                      width={28}
                      height={28}
                    />
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
