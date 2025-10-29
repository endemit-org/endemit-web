import { TileConfig } from "@/app/_components/grid/TileConfig";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import clsx from "clsx";
import EndemitLogo from "@/app/_components/icon/EndemitLogo";

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
              className={clsx(
                "w-full h-full object-cover ",
                config.link &&
                  "group-hover:scale-125 transition-all duration-500 ease-out"
              )}
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
              className={clsx(
                "w-full h-full object-cover ",
                config.link &&
                  "group-hover:scale-125 transition-transform duration-500 ease-out"
              )}
            />
          )}
          {config.link && (
            <div className="absolute left-0 top-0 right-0 w-full bottom-0 border-[20px] z-20 border-white scale-125 group-hover:scale-100 transition-transform duration-300 pointer-events-none" />
          )}
          {(config.title || config.subtitle) && (
            <div className="absolute inset-0 p-3 lg:p-6 flex flex-col justify-end z-10 group-hover:scale-95 transition-transform duration-300 w-full">
              {config.title && (
                <h3 className="font-bold text-2xl lg:text-4xl uppercase leading-tight ">
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
        </div>
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
    <div
      className={`${baseClasses} cursor-not-allowed group`}
      style={dynamicStyles}
    >
      {content}
      <div
        className={
          "absolute flex justify-between items-center bottom-2 left-0 w-full px-3 translate-y-[140%] group-hover:translate-y-0 transition-transform duration-300 ease-in-out"
        }
      >
        <div className={"text-neutral-300 w-16"}>
          <EndemitLogo />
        </div>
        <div
          className={
            "text-xs text-neutral-900 bg-neutral-200/30 px-2 py-0.5 rounded-md backdrop-blur-lg"
          }
        >
          Not clickable, just art
        </div>
      </div>
    </div>
  );
}
