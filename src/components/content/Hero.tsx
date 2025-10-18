import Link from "next/link";
import Image from "next/image";

export interface HeroProps {
  heading: string;
  description?: string;
  primaryCta?: {
    text: string;
    href: string;
  };
  secondaryCta?: {
    text: string;
    href: string;
  };
  backgroundImage?: {
    src: string;
    alt: string;
  };
  textAlignment?: "left" | "center";
  overlayOpacity?: number;
}

export default function Hero({
  heading,
  description,
  primaryCta,
  secondaryCta,
  backgroundImage,
  textAlignment = "center",
  overlayOpacity = 50,
}: HeroProps) {
  const alignmentClasses = {
    left: "text-left items-start",
    center: "text-center items-center",
  };

  return (
    <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
      {backgroundImage && (
        <>
          <Image
            src={backgroundImage.src}
            alt={backgroundImage.alt}
            fill
            className="object-cover"
            priority
          />
          <div
            className="absolute inset-0 bg-black"
            style={{ opacity: overlayOpacity / 100 }}
          />
        </>
      )}

      <div className="relative z-10 w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`flex flex-col gap-6 ${alignmentClasses[textAlignment]}`}
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white max-w-4xl">
            {heading}
          </h1>

          {description && (
            <p className="text-lg sm:text-xl text-white/90 max-w-2xl">
              {description}
            </p>
          )}

          {(primaryCta || secondaryCta) && (
            <div className="flex flex-wrap gap-4 mt-2">
              {primaryCta && (
                <Link
                  href={primaryCta.href}
                  className="px-8 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {primaryCta.text}
                </Link>
              )}

              {secondaryCta && (
                <Link
                  href={secondaryCta.href}
                  className="px-8 py-3 bg-transparent text-white font-semibold rounded-lg border-2 border-white hover:bg-white/10 transition-colors"
                >
                  {secondaryCta.text}
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
