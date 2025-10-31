import clsx from "clsx";

interface Props {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function OuterPage({ children, className, style }: Props) {
  return (
    <div
      className={clsx(" mx-auto space-y-8 sm:max-w-full", className)}
      style={style}
    >
      {children}
    </div>
  );
}
