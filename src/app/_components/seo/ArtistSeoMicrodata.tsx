import { Artist } from "@/domain/artist/types/artist";
import { PUBLIC_BASE_WEB_URL } from "@/lib/services/env/public";
import SeoSchema from "@/app/_components/seo/SeoSchema";

type Props = {
  artist: Artist;
};

export default function ArtistSeoMicrodata({ artist }: Props) {
  const artistSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: artist.name,
    jobTitle: "DJ",
    ...(artist.image?.src && { image: artist.image.src }),
    url: `${PUBLIC_BASE_WEB_URL}/artists/${artist.uid}`,
    ...(artist.links.length > 0 && {
      sameAs: artist.links.map(link => link.url).filter(Boolean),
    }),
  };

  return <SeoSchema>{artistSchema}</SeoSchema>;
}
