import Image from "next/image";

type Props = {
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
};

export default function ImageWithFallback({
  src,
  alt,
  width = 400,
  height = 400,
  className,
}: Props) {
  const imageSrc = src ?? "/images/noise.gif";

  return (
    <Image
      src={imageSrc}
      alt={alt ?? ""}
      width={width}
      height={height}
      className={className}
    />
  );
}
