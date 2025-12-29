import { ReactNode } from "react";
import AnimatedWarningIcon from "@/app/_components/icon/AnimatedWarningIcon";

export type BannerProps = {
  title?: string | null;
  children: ReactNode;
};

export default function Banner({ title, children }: BannerProps) {
  return (
    <div
      className={
        "bg-black/90 rounded-md px-3 pb-2 pt-4 mb-6 gap-3 backdrop-blur text-center text-neutral-200 border border-dotted border-neutral-200 drop-shadow-2xl"
      }
      style={{
        backgroundImage: "url('/images/worms.png')",
        backgroundRepeat: "repeat",
        backgroundBlendMode: "soft-light",
        backgroundSize: "150px",
      }}
    >
      <div className="scale-75 flex justify-center items-center">
        <AnimatedWarningIcon />
      </div>
      {title && (
        <div
          className={"text-xl font-semibold mb-2 animate-scan text-[#fbbf24]"}
        >
          {title}
        </div>
      )}
      {children}
    </div>
  );
}
