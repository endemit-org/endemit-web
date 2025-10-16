import { sizeMap, TileConfig } from "@/components/grid/TileConfig";

interface Props {
  config: TileConfig;
}

export default function Tile({ config }: Props) {
  const { col, row } = sizeMap[config.size];
  const baseClasses = `${col} ${row} ${config?.className} relative overflow-hidden group transition-all`;
  const bgColor = config.backgroundColor || "bg-white";
  const textColor = config.textColor || "text-black";

  const content = (
    <>
      {config.media && (
        <div className="absolute inset-0">
          {config.media.type === "video" ? (
            <video
              src={config.media.src}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <img
              src={config.media.src}
              alt={config.title || ""}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
            />
          )}
        </div>
      )}

      {(config.title || config.subtitle) && (
        <div
          className={`absolute inset-0 p-4 lg:p-6 flex flex-col justify-end ${textColor} z-10`}
        >
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
        <div className="absolute inset-4 border-2 border-white scale-110 group-hover:scale-100 transition-transform duration-300 pointer-events-none" />
      )}
    </>
  );

  if (config.link) {
    return (
      <a
        href={config.link}
        className={`${baseClasses} ${bgColor} cursor-pointer`}
      >
        {content}
      </a>
    );
  }

  return <div className={`${baseClasses} ${bgColor}`}>{content}</div>;
}
