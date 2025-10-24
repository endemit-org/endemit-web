import Image from "next/image";
import Link from "next/link";
import { RichTextField } from "@prismicio/client";
import RichTextDisplay from "@/app/_components/content/RichTextDisplay";

interface ArtistLink {
  url: string;
  type: string;
}

interface Artist {
  name: string;
  description?: RichTextField | null;
  image: { src: string; alt: string | null } | null;
  links: ArtistLink[] | null;
}

interface PodcastArtistSectionProps {
  artist: Artist;
  coverSrc?: string;
}

export default function ArtistProfile({
  artist,
  coverSrc,
}: PodcastArtistSectionProps) {
  return (
    <div className="relative overflow-hidden mb-40">
      <div className="flex gap-x-12 max-lg:flex-col max-lg:gap-y-16 max-lg:items-center">
        {artist.image && (
          <div>
            <Image
              src={artist.image.src}
              alt={artist.image.alt ?? artist.name}
              width={300}
              height={300}
              className="rounded-md object-cover max-sm:w-full"
            />
          </div>
        )}
        <div className="flex-1">
          <div className="bg-gradient-to-b from-neutral-300 to-neutral-400 bg-clip-text text-transparent relative">
            <h1
              className="text-5xl lg:text-7xl 2xl:text-8xl font-bold text-transparent bg-clip-text blur-[5px] top-0 absolute scale-110"
              style={{
                backgroundImage: `url('${coverSrc}')`,
                backgroundSize: "1000px",
                backgroundRepeat: "repeat",
              }}
            >
              {artist.name}
            </h1>
            <h2 className="text-5xl lg:text-7xl 2xl:text-8xl mb-6 text-neutral-300 relative">
              {artist.name}
            </h2>
            {artist.description && (
              <RichTextDisplay richText={artist.description} />
            )}
          </div>
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
