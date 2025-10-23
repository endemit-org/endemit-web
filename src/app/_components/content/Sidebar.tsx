"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import clsx from "clsx";
import { usePathname } from "next/navigation";
import Cart from "@/app/_components/cart/Cart";
import EndemitLogo from "@/app/_components/icon/EndemitLogo";
import AnimatedEndemitLogo from "@/app/_components/icon/AnimatedEndemitLogo";
import MenuClosedIcon from "@/app/_components/icon/MenuClosedIcon";
import MenuOpenIcon from "@/app/_components/icon/MenuOpenIcon";

interface NavigationItem {
  label: string;
  href: string;
  onClick?: () => void;
  isBackButton?: boolean;
  isActive?: (pathname: string) => boolean;
}

interface SocialLink {
  href: string;
  iconSrc: string;
  alt: string;
  width?: number;
  height?: number;
  id: "facebook" | "email" | "instagram";
}

interface FooterInfo {
  lines: string[];
  href?: string;
}

interface FlexibleSidebarProps {
  logoHref?: string;
  navigationItems: NavigationItem[];
  socialLinks?: SocialLink[];
  footerInfo?: FooterInfo;
  showFooter?: boolean;
  hideCartOnPath?: string[];
  activeColor?: string;
}

export default function Sidebar({
  logoHref = "/",
  navigationItems,
  socialLinks = [],
  footerInfo,
  showFooter = true,
  hideCartOnPath,
  activeColor = "text-blue-500",
}: FlexibleSidebarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const defaultSocialLinks: SocialLink[] = [
    {
      id: "facebook",
      href: "https://www.facebook.com/endemit.crew",
      iconSrc: "/images/facebook.png",
      alt: "Facebook",
    },
    {
      id: "instagram",
      href: "https://instagram.com/ende.mit",
      iconSrc: "/images/instagram.png",
      alt: "Instagram",
    },
    {
      id: "email",
      href: "mailto:endemit@endemit.org",
      iconSrc: "/images/email.png",
      alt: "Email",
    },
  ];

  const mergedSocialLinks = defaultSocialLinks.map(defaultLink => {
    const customLink = socialLinks.find(link => link.id === defaultLink.id);
    return customLink ? { ...defaultLink, ...customLink } : defaultLink;
  });

  const isItemActive = (item: NavigationItem) => {
    if (item.isActive) {
      return item.isActive(pathname);
    }
    return pathname === item.href || pathname.startsWith(item.href + "/");
  };

  const showCart = !hideCartOnPath?.includes(pathname);

  const close = () => {
    setIsMenuOpen(false);
  };

  const handleNavClick = (item: NavigationItem) => {
    if (item.onClick) {
      item.onClick();
    }
    close();
  };

  return (
    <div className="fixed top-0 !z-40 flex w-full flex-col bg-neutral-950 lg:bottom-0 lg:z-auto lg:w-72 lg:border-r lg:border-neutral-800 lg:py-12  lg:border-l-[1px] lg:border-x-neutral-800">
      <div className="flex h-14 items-center px-4 py-4 lg:h-auto ">
        <Link
          href={logoHref}
          onClick={close}
          className="lg:mx-3 lg:ml-auto hover:opacity-70 transition-opacity ease-in-out"
        >
          {/*{ Show animated logo on desktop}*/}
          <div className="w-24 lg:w-32 text-neutral-200 max-lg:hidden">
            <AnimatedEndemitLogo />
          </div>
          {/*{ Show regular logo on mobile }*/}
          <div className="w-24 lg:w-32 text-neutral-200  lg:hidden">
            <EndemitLogo />
          </div>
        </Link>
      </div>

      <div className="flex absolute right-0 top-0 lg:hidden gap-x-4">
        {showCart && <Cart variant={"compact"} />}

        <button
          type="button"
          className="group flex h-14 items-center gap-x-2 px-4 text-gray-100 hover:text-gray-400"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <div
            className="font-medium font-heading text-xl"
            style={{ paddingTop: "4px" }}
          >
            MENU
          </div>

          {isMenuOpen ? <MenuOpenIcon /> : <MenuClosedIcon />}
        </button>
      </div>

      <div
        className={clsx("lg:flex lg:flex-col lg:flex-1 lg:min-h-0 ", {
          "fixed inset-x-0 bottom-0 top-14  bg-neutral-950 flex flex-col":
            isMenuOpen,
          hidden: !isMenuOpen,
        })}
      >
        {/* Scrollable navigation area */}
        <nav className="px-5 pb-7 pt-5 text-2xl lg:text-xl space-y-2 overflow-y-auto lg:flex-1 font-heading tracking-widest">
          {navigationItems.map((item, index) => {
            const isActive = isItemActive(item);
            return (
              <Link
                key={index}
                onClick={() => handleNavClick(item)}
                href={item.href}
                className={clsx(
                  "block rounded-md px-3 py-2 text-right font-regular uppercase sm:pt-2 pt-4 transition-colors ease-in-out",
                  item.isBackButton && "text-sm opacity-85",
                  isActive && `${activeColor} cursor-default`,
                  !isActive &&
                    "text-neutral-200 hover:text-gray-300 active:text-gray-600"
                )}
              >
                {item.isBackButton && "← "}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Pinned bottom section - Cart and Social */}
        <div className="flex-shrink-0">
          {showCart && (
            <div className="px-5 pb-4">
              <Cart variant={"detailed"} />
            </div>
          )}

          {mergedSocialLinks.length > 0 && (
            <div className="social-icons flex justify-end pr-6 pb-4">
              {mergedSocialLinks.map(social => (
                <a
                  key={social.id}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-70"
                >
                  <Image
                    src={social.iconSrc}
                    alt={social.alt}
                    width={social.width || 28}
                    height={social.height || 28}
                    className="mx-2"
                  />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {showFooter && footerInfo && (
          <div className="hidden sm:block flex-shrink-0 text-right text-neutral-400">
            <div className="flex flex-row justify-between p-3.5 lg:px-5 lg:py-3 w-full">
              <div
                className="flex flex-col justify-between text-sm w-full"
                style={{ paddingTop: "3px" }}
              >
                {footerInfo.href ? (
                  <a href={footerInfo.href}>
                    {footerInfo.lines.map((line, index) => (
                      <div
                        key={index}
                        className={index === 0 ? "text-right" : ""}
                      >
                        {line}
                      </div>
                    ))}
                  </a>
                ) : (
                  footerInfo.lines.map((line, index) => (
                    <div
                      key={index}
                      className={index === 0 ? "text-right" : ""}
                    >
                      {line}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
