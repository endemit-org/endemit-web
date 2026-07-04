import type { Metadata } from "next";
import RootShell from "@/app/_components/RootShell";
import { buildRootMetadata } from "@/lib/util/rootMetadata";

// Admin, POS, scan, staging and the slice simulator are English-only and are
// intentionally kept out of the localized ([locale]) tree.
export const metadata: Metadata = buildRootMetadata("en_US");

export default function UnlocalizedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <RootShell lang="en">{children}</RootShell>;
}
