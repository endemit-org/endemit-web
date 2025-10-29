import clsx from "clsx";

interface Props {
  children: React.ReactNode;
  className?: string;
}

export default function OuterPage({ children, className }: Props) {
  return (
    <div className={clsx(" mx-auto space-y-8 sm:max-w-full", className)}>
      {children}
    </div>
  );
}
