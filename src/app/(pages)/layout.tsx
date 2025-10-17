import Sidebar from "@/components/Sidebar";
import SiteFooter from "@/components/SiteFooter";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <body
      className="m-auto overflow-y-scroll bg-black "
      style={{
        backgroundImage: "url('/images/endemit-pattern.svg')",
        backgroundSize: "110px",
      }}
    >
      <div className="max-w-8xl m-auto">
        <Sidebar
          navigationItems={[
            { label: "Main", href: "/" },
            { label: "Events", href: "/events" },
            { label: "Music", href: "/music" },
            { label: "Store", href: "/store" },
            { label: "About", href: "/about" },
          ]}
          hideCartOnPath={["/store/checkout"]}
        />

        <div className="lg:ml-72 relative bg-neutral-900 min-h-screen lg:my-12 lg:rounded-r-xl lg:border-y-2 lg:border-r-2 lg:border-neutral-800 p-4 lg:p-12 max-lg:my-20">
          {children}
          <SiteFooter />
        </div>
      </div>
    </body>
  );
}
