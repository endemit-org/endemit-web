import Link from "next/link";

export default function SiteFooter() {
  const links = [
    { href: "/terms-and-conditions", label: "Terms and conditions" },
    { href: "/privacy-policy", label: "Privacy policy" },
    // {
    //   href: "/notice-on-purchase-of-digital-products",
    //   label: "Purchase of digital products",
    // },
    { href: "/right-to-withdrawal", label: "Right to withdrawal" },
  ];

  const Divider = () => <span className={"mx-1"}> · </span>;

  return (
    <footer
      className={
        "text-neutral-500 absolute -bottom-14 lg:-bottom-8 text-center w-full text-xs left-0 max-lg:px-5"
      }
    >
      Copyright Kulturno društvo endemit {new Date().getFullYear()}
      <span className="max-lg:hidden">
        <Divider />
      </span>
      <div className={"lg:inline-block max-lg:mt-2"}>
        {links.map((link, index) => (
          <span key={link.href}>
            {index > 0 && <Divider />}
            <Link href={link.href}>{link.label}</Link>
          </span>
        ))}
      </div>
    </footer>
  );
}
