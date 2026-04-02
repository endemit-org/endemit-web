import clsx from "clsx";
import Image from "next/image";

type Props = {
  className?: string;
};

export default function EventTicketAvailableStatus({ className }: Props) {
  return (
    <div className={clsx("absolute top-4 left-4 z-10", className)}>
      <span className="backdrop-blur-lg px-2 py-1 text-neutral-300  text-sm flex w-fit gap-x-2  uppercase font-bold border border-neutral-700">
        <Image
          width={40}
          height={40}
          src="/images/flame.gif"
          alt="Hot"
          className="w-5 h-5 ml-1"
          unoptimized
        />
        <span className={"animate-pulse"}>Tickets limited</span>
      </span>
    </div>
  );
}
