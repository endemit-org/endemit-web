export default function StagingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <body
      className="m-auto overflow-y-scroll bg-black w-full h-full text-neutral-200 "
      style={{
        backgroundImage: "url('/images/endemit-pattern.svg')",
        backgroundSize: "110px",
      }}
    >
      {children}
    </body>
  );
}
