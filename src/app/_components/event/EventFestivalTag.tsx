import clsx from "clsx";

type Props = {
  className?: string;
};

export default function EventFestivalTag({ className }: Props) {
  return (
    <div className={clsx("absolute top-4 right-4 z-10", className)}>
      <span className="backdrop-blur-lg bg-neutral-950/30 px-2 py-1 text-neutral-200 text-sm flex w-fit gap-x-2 uppercase font-bold border border-neutral-700/70">
        Festival
      </span>
    </div>
  );
}
