import Image from "next/image";

type Props = {
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
};

export default function ImageWithFallback({
  src,
  alt,
  width = 400,
  height = 400,
  className,
  sizes,
}: Props) {
  const imageSrc = src ?? "/images/noise.gif";

  return (
    <Image
      src={imageSrc}
      alt={alt ?? ""}
      width={width}
      height={height}
      className={className}
      sizes={sizes}
    />
  );
}
