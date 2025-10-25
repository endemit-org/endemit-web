import Image from "next/image";
import Link from "next/link";

export interface ImageTextSplitProps {
  image: {
    src: string;
    alt: string;
  };
  heading: string;
  description: string;
  cta?: {
    text: string;
    href: string;
  };
  layout: "imageLeft" | "imageRight" | "imageOverlay";
  overlayOpacity?: number;
  textPosition?: "left" | "center" | "right";
}

export default function ImageTextSplit({
  image,
  heading,
  description,
  cta,
  layout,
  overlayOpacity = 60,
  textPosition = "center",
}: ImageTextSplitProps) {
  if (layout === "imageOverlay") {
    const positionClasses = {
      left: "items-start text-left",
      center: "items-center text-center",
      right: "items-end text-right",
    };

    return (
      <div className="relative w-full min-h-[500px] flex items-center">
        <Image src={image.src} alt={image.alt} fill className="object-cover" />
        <div
          className="absolute inset-0 bg-neutral-950"
          style={{ opacity: overlayOpacity / 100 }}
        />
        <div className="relative z-10 w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={`w-full flex flex-col gap-6 ${positionClasses[textPosition]}`}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-200">
              {heading}
            </h2>
            <p className="text-lg text-neutral-400">{description}</p>
            {cta && (
              <Link
                href={cta.href}
                className="inline-block px-8 py-3 bg-neutral-200 text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors w-fit"
              >
                {cta.text}
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  const isImageLeft = layout === "imageLeft";

  return (
    <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div
        className={`grid md:grid-cols-2 gap-8 items-center ${isImageLeft ? "" : "md:grid-flow-dense"}`}
      >
        <div
          className={`relative aspect-[4/3] overflow-hidden rounded-sm ${isImageLeft ? "" : "md:col-start-2"}`}
        >
          <Image
            src={image.src}
            alt={image.alt}
            fill
            className="object-cover"
          />
        </div>
        <div
          className={`flex flex-col gap-6 ${isImageLeft ? "" : "md:col-start-1 md:row-start-1"}`}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-200">
            {heading}
            {heading}
          </h2>
          <p className="text-lg text-neutral-400">{description}</p>
          {cta && (
            <Link
              href={cta.href}
              className="inline-block px-8 py-3 bg-gray-900 text-neutral-200 font-semibold rounded-lg hover:bg-gray-800 transition-colors w-fit"
            >
              {cta.text}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
