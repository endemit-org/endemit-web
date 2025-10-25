export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <body
      className="m-auto overflow-y-scroll bg-neutral-950 "
      style={{
        backgroundImage: "url('/images/endemit-pattern.svg')",
        backgroundSize: "110px",
      }}
    >
      <div className="min-h-screen ">{children}</div>
    </body>
  );
}
