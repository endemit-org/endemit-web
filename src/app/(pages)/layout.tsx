import Sidebar from "@/app/_components/ui/Sidebar";
import SiteFooter from "@/app/_components/ui/SiteFooter";
import { fetchNavigationMenuFromCms } from "@/domain/cms/operations/fetchNavigationMenuFromCms";
import { PersistentPlayer } from "@/app/_components/player/PersistentPlayer";
import { getCurrentUser } from "@/lib/services/auth";
import SessionGuard from "@/app/_components/auth/SessionGuard";
import UserIcon from "@/app/_components/icon/UserIcon";

export default async function ContentPageLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const menuItems = await fetchNavigationMenuFromCms();
  const user = await getCurrentUser();

  return (
    <>
      <div className="max-w-8xl m-auto">
        {menuItems && (
          <Sidebar
            navigationItems={[
              ...(user
                ? [
                    {
                      label: "My Profile",
                      href: "/profile",
                      type: "secondary" as const,
                      icon: <UserIcon className="w-5 h-5" />,
                    },
                  ]
                : []),
              ...menuItems.items.map(item => ({
                label: item.label,
                href: item.link,
                type: item.linkType,
                ctaText: item.ctaText,
              })),
            ]}
            hideCartOnPath={["/store/checkout"]}
            user={
              user
                ? {
                    name: user.name,
                    email: user.email || null,
                    roles: user.roles,
                  }
                : null
            }
          />
        )}

        <div className="lg:ml-72 relative bg-neutral-900 min-h-screen lg:mt-12 lg:mb-20 lg:rounded-r-xl lg:border-y-2 lg:border-r-2 lg:border-neutral-800  max-lg:mb-36 max-lg:mt-14  ">
          <div
            className="absolute  top-0 bottom-0 left-0 right-0 bg-neutral-900 opacity-50 min-h-screen"
            style={{
              backgroundImage: "url('/images/worms.png')",
              backgroundRepeat: "repeat",
              backgroundBlendMode: "multiply",
              backgroundSize: "150px",
            }}
          />
          <div className={"overflow-hidden relative p-4 lg:p-12 max-lg:py-12"}>
            <div className={"relative"}>{children}</div>
          </div>
          <SiteFooter />
        </div>
      </div>
      <PersistentPlayer />
      <SessionGuard hasUser={!!user} />
    </>
  );
}
