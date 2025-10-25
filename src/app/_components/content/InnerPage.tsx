import clsx from "clsx";

interface Props {
  children?: React.ReactNode;
  className?: string;
}

export default function InnerPage({ children, className }: Props) {
  return (
    <div
      className={clsx(
        "text-neutral-200 bg-neutral-800 p-4 lg:p-10 max-lg:py-8 rounded-md relative overflow-hidden",
        className
      )}
    >
      {children}
    </div>
  );
}
