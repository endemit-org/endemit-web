export default function StagingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="min-h-screen text-neutral-200">{children}</div>;
}
