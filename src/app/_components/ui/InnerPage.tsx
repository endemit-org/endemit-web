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
        "shadow-[0_6px_7px_rgba(0,0,0,0.4)] lg:rounded-tr-none",
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
}
