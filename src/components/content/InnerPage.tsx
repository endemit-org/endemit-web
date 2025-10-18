interface Props {
  children: React.ReactNode;
}

export default function InnerPage({ children }: Props) {
  return (
    <div
      className={
        "text-neutral-200 bg-neutral-800 p-4 lg:p-10 max-lg:py-8 rounded-md relative overflow-hidden"
      }
    >
      {children}
    </div>
  );
}
