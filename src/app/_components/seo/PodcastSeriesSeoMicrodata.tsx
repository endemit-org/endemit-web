import { PUBLIC_BASE_WEB_URL } from "@/lib/services/env/public";
import SeoSchema from "@/app/_components/seo/SeoSchema";

export default function PodcastSeriesSeoMicrodata() {
  const seriesSchema = {
    "@context": "https://schema.org",
    "@type": "PodcastSeries",
    name: "EMIT Podcast",
    description:
      "Emit is Endemit's curated podcast series - a sonic chronicle of the collective's underground techno culture. More than just a mix series, it serves as both archive and amplifier for the Endemit sound. Each episode captures either a live recording from an Endemit event, preserving the raw energy of the moment, or a specially crafted studio mix that represents the artist's current sonic exploration. The series features residents, international guests who've graced Endemit events, and emerging regional talents who align with the collective's vision of forward-thinking, hypnotic techno.",
    url: `${PUBLIC_BASE_WEB_URL}/music/emit`,
    author: {
      "@type": "Organization",
      name: "Endemit",
    },
  };

  return <SeoSchema>{seriesSchema}</SeoSchema>;
}
