interface Props {
  children: React.ReactNode;
}

export default function OuterPage({ children }: Props) {
  return <div className=" mx-auto space-y-8 sm:max-w-full ">{children}</div>;
}
