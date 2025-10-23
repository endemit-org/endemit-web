export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <body
      className="m-auto overflow-y-scroll bg-black "
      style={{
        backgroundImage: "url('/images/endemit-pattern.svg')",
        backgroundSize: "110px",
      }}
    >
      <div className="min-h-screen bg-gray-100">{children}</div>
    </body>
  );
}
