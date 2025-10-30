import clsx from "clsx";

interface Props {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function InnerPage({ children, className, style }: Props) {
  return (
    <div
      className={clsx(
        "text-neutral-200 bg-neutral-800 p-4 lg:p-10 max-lg:py-8 rounded-md relative overflow-hidden",
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
}
