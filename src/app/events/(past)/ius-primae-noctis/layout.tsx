import type { Metadata } from "next";
import Sidebar from "@/app/_components/content/Sidebar";
import EventFooter from "@/app/_components/event/EventFooter";

export const metadata: Metadata = {
  title: "Ius Primae Noctis",
  description:
    "Electronic music event by Endemit in Kader, Grad Kodeljevo, June 20 2025.",
  openGraph: {
    images: ["/images/ius-primae-noctis/cover.jpg"],
  },
  twitter: {
    card: "summary_large_image",
  },
  icons: {
    icon: "/images/endemit-logo.jpg",
  },
};

export default function IusPrimaeNoctisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <body
      className="m-auto overflow-y-scroll bg-black "
      style={{
        backgroundImage: "url('/images/endemit-pattern.svg')",
        backgroundSize: "110px",
      }}
    >
      <div className="max-w-8xl m-auto overflow-hidden relative ">
        <Sidebar
          navigationItems={[
            {
              label: "Events",
              href: "/events",
              isBackButton: true,
            },
            {
              label: "Ius Primae Noctis",
              href: "/events/ius-primae-noctis",
            },
            {
              label: "Artists",
              href: "/events/ius-primae-noctis/artists",
            },
            {
              label: "Location",
              href: "/events/ius-primae-noctis/location",
            },
            {
              label: "Tickets",
              href: "/events/ius-primae-noctis/tickets",
            },
          ]}
          socialLinks={[
            {
              id: "facebook",
              href: "https://www.facebook.com/events/985739330046224",
              iconSrc: "/images/facebook.png",
              alt: "Facebook",
            },
          ]}
          footerInfo={{
            lines: ["Grad Kodeljevo", "Ul. Carla Benza 20"], // Assuming default location
            href: "/events/ius-primae-noctis/location",
          }}
        />
        <div className={"pb-16"}>{children}</div>
        <EventFooter ticketsLink={"/events/ius-primae-noctis/tickets"} />
      </div>
    </body>
  );
}
