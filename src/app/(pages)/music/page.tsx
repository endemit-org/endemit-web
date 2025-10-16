import type { Metadata } from "next";
import OuterPage from "@/components/OuterPage";
import PageHeadline from "@/components/PageHeadline";
import InnerPage from "@/components/InnerPage";
import SoundCloudEmbed from "@/components/SoundCloudEmbed";

export const metadata: Metadata = {
  title: "Music",
  description:
    "Sets, mixes, and productions from the Endemit team and live recordings from our events.",
  openGraph: {
    images: ["/images/og/endemit-og.png"],
  },
  twitter: {
    card: "summary_large_image",
  },
};

const tracks = [
  {
    trackUrl:
      "https://api.soundcloud.com/tracks/soundcloud%253Atracks%253A2178144495",
    trackTitle:
      "Emit 003 · Amanda Mussi · Oct 4 2025 (recorded live at Cvetke v Jeseni, at Kader Kodeljevo, Nov 29 2024)",
    trackTitleUrl: "https://soundcloud.com/ende-mit/emit-003",
  },
  {
    trackUrl: "https://api.soundcloud.com/tracks/2164932096",
    trackTitle: "Emit 002 · Obscur · Sep 6 2025",
    trackTitleUrl: "https://soundcloud.com/ende-mit/emit-002",
  },
  {
    trackUrl: "https://api.soundcloud.com/tracks/2140222152",
    trackTitle: "Emit 001 · Rhaegal · Aug 23 2025",
    trackTitleUrl: "https://soundcloud.com/ende-mit/rhaegal-emit-001",
  },
];

export default function Music() {
  return (
    <OuterPage>
      <PageHeadline
        title={"Music"}
        segments={[
          { label: "Endemit", path: "" },
          { label: "Music", path: "music" },
        ]}
      />

      <InnerPage>
        <div className="space-y-4">
          <p className="text-gray-300 leading-relaxed text-xl">
            <span className="font-bold text-3xl  tracking-wider text-white">
              emit
            </span>{" "}
            <br></br>A creative outlet where we publish a series of sets, mixes,
            and productions coming from Endemit team, and music recorded at
            Endemit events.
          </p>
        </div>

        {tracks.map((track, index) => (
          <SoundCloudEmbed key={index} {...track} />
        ))}
      </InnerPage>
    </OuterPage>
  );
}
