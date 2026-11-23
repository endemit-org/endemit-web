import type { Metadata } from "next";
import FestivalExperience from "@/app/_components/festival/FestivalExperience";
import { editorialCopy } from "@/app/_components/festival/editorialCopy";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const copy = editorialCopy[locale === "en" ? "en" : "sl"];
  return {
    title: `Endemit · ${copy.title.join(" ")}`,
    description: copy.intro,
    robots: { index: false, follow: false },
  };
}

export default async function FestivalPage({ params }: PageProps) {
  const { locale } = await params;
  const language = locale === "en" ? "en" : "sl";
  return <FestivalExperience locale={language} />;
}
