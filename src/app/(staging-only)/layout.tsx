export default function StagingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="min-h-dvh text-neutral-200">{children}</div>;
}
