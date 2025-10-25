import { JSXMapSerializer, PrismicRichText } from "@prismicio/react";
import { RichTextField } from "@prismicio/client";
import Link from "next/link";

interface Props {
  richText?: RichTextField | null;
}

const components: JSXMapSerializer = {
  // heading1: ({ children }) => (
  //   <h1 className="text-4xl font-bold">{children}</h1>
  // ),
  // heading2: ({ children }) => (
  //   <h2 className="text-3xl font-semibold">{children}</h2>

  // paragraph: ({ children }) => <p className="mb-4">{children}</p>,
  hyperlink: ({ node, children }) => (
    <Link href={node.data.url!} className="link">
      {children}
    </Link>
  ),
};

export default function RichTextDisplay({ richText }: Props) {
  return <PrismicRichText field={richText} components={components} />;
}
