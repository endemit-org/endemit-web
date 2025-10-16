import { TileConfig } from "@/components/grid/TileConfig";
import TileGrid from "@/components/grid/TileGrid";

export default function Home() {
  const tiles: TileConfig[] = [
    {
      id: "1",
      size: "small",
      title: "News",
      backgroundColor: "bg-blue-500",
      textColor: "text-white",
    },
    {
      id: "99",
      size: "tall",
      title: "News",
      backgroundColor: "bg-blue-500",
      textColor: "text-white",
    },
    {
      id: "2",
      size: "large",
      title: "T-SHIRT 2025",
      media: {
        type: "video",
        src: "https://endemit.cdn.prismic.io/endemit/aOeRpJ5xUNkB1yBT_temp_product_video.mp4",
      },
      link: "/store/merch/tshirt-endemit-2025-edition",
      textColor: "text-white",
    },
    {
      id: "3",
      size: "small",
      title: "Events",
      backgroundColor: "bg-red-300",
      textColor: "text-black",
    },
    {
      id: "4",
      size: "tall",
      title: "Gallery",
      subtitle: "View our latest work",
      backgroundColor: "bg-purple-400",
      textColor: "text-white",
    },
    {
      id: "5",
      size: "wide",
      title: "Featured",
      subtitle: "Check out our featured content",
      backgroundColor: "bg-yellow-300",
      textColor: "text-black",
    },
    {
      id: "6",
      size: "small",
      backgroundColor: "bg-green-400",
    },
    {
      id: "7",
      size: "small",
      title: "Collection",
      backgroundColor: "bg-indigo-500",
      textColor: "text-white",
      link: "/collection",
    },
    {
      id: "8",
      size: "small",
      title: "Shop",
      backgroundColor: "bg-pink-400",
      textColor: "text-white",
    },
  ];

  return <TileGrid tiles={tiles} />;
}
