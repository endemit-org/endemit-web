import clsx from "clsx";
import Image from "next/image";

type Props = {
  className?: string;
};

export default function EventTicketAvailableStatus({ className }: Props) {
  return (
    <div className={clsx("absolute top-4 left-4 z-10", className)}>
      <span className="px-2 py-1 bg-neutral-200 text-neutral-950 animate-pulse text-sm flex w-fit gap-x-2  uppercase font-bold">
        <Image
          width={40}
          height={40}
          src="/images/flame.gif"
          alt="Hot"
          className="w-5 h-5 ml-1"
        />
        Tickets limited
      </span>
    </div>
  );
}
