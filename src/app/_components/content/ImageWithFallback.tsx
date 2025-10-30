import Image from "next/image";

type Props = {
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
  placeholder?: string;
  quality?: number | string;
  loading?: "lazy" | "eager";
  fill?: boolean;
  priority?: boolean;
  onClick?: () => void;
};

export default function ImageWithFallback({
  src,
  alt,
  width = 400,
  height = 400,
  className,
  sizes,
  quality,
  placeholder,
  loading,
  priority = false,
  fill = false,
  onClick,
}: Props) {
  const imageSrc = src ?? "/images/noise.gif";

  return (
    <>
      <Image
        src={imageSrc}
        alt={alt ?? ""}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        className={className}
        sizes={sizes}
        loading={loading ?? undefined}
        quality={quality ? Number(quality) : undefined}
        placeholder={placeholder ? "blur" : "empty"}
        blurDataURL={placeholder ? placeholder : undefined}
        fill={fill}
        priority={priority}
        onClick={onClick ?? undefined}
      />
    </>
  );
}
