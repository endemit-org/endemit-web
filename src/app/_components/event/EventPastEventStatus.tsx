import clsx from "clsx";

type Props = {
  className?: string;
};

export default function EventPastEventStatus({ className }: Props) {
  return (
    <div className={clsx("absolute top-4 left-4 z-10", className)}>
      <span className="px-2 py-1 bg-neutral-950/90 text-neutral-200 text-sm flex w-fit gap-x-2  uppercase font-bold">
        Past event
      </span>
    </div>
  );
}
