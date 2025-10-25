import { TileConfig } from "@/app/_components/grid/TileConfig";
import Image from "next/image";
import Link from "next/link";
import React from "react";

interface Props {
  config: TileConfig;
}

export default function Tile({ config }: Props) {
  const baseClasses = `${config?.className} relative  group transition-all h-full overflow-hidden bg-red-200`;

  const dynamicStyles = {
    backgroundColor: config.backgroundColor || "#e5e5e5",
    color: config.textColor || "#000000",
  };

  const content = (
    <>
      {config.media && (
        <div className="relative w-full h-full overflow-hidden">
          {config.media.type === "video" ? (
            <video
              src={config.media.src}
              className="w-full h-full object-cover group-hover:scale-125 transition-all duration-500 ease-out"
              autoPlay={true}
              muted={true}
              loop={true}
              playsInline={true}
            />
          ) : (
            <Image
              src={config.media.src}
              width={600}
              height={600}
              alt={config.title || ""}
              className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-500 ease-out"
            />
          )}
        </div>
      )}
      {(config.title || config.subtitle) && (
        <div className="absolute inset-0  lg:p-6 flex flex-col justify-end z-10">
          {config.media && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent -z-10" />
          )}
          {config.title && (
            <h3 className="font-bold text-2xl lg:text-4xl uppercase leading-tight group-hover:scale-95 transition-transform duration-300">
              {config.title}
            </h3>
          )}
          {config.subtitle && (
            <p className="text-sm lg:text-base mt-2 opacity-90">
              {config.subtitle}
            </p>
          )}
        </div>
      )}

      {config.link && (
        <div className="absolute inset-0 border-[20px] border-white scale-125 group-hover:scale-100 transition-transform duration-300 pointer-events-none" />
      )}
    </>
  );

  if (config.link) {
    return (
      <Link
        href={config.link}
        className={`${baseClasses} cursor-pointer`}
        style={dynamicStyles}
      >
        {content}
      </Link>
    );
  }

  return (
    <div className={baseClasses} style={dynamicStyles}>
      {content}
    </div>
  );
}
