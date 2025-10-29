import { JSXMapSerializer, PrismicRichText } from "@prismicio/react";
import { RichTextField } from "@prismicio/client";
import Link from "next/link";

interface Props {
  richText?: RichTextField | null;
}

const components: JSXMapSerializer = {
  heading1: ({ children }) => (
    <h1 className="text-4xl font-bold">{children}</h1>
  ),
  heading2: ({ children }) => (
    <h2 className="text-3xl font-semibold pt-12">{children}</h2>
  ),

  // paragraph: ({ children }) => <p className="mb-4">{children}</p>,
  hyperlink: ({ node, children }) => (
    <Link href={node.data.url!} className="link">
      {children}
    </Link>
  ),
  list: ({ children }) => <ul className={"list-disc"}>{children}</ul>,
};

export default function RichTextDisplay({ richText }: Props) {
  return <PrismicRichText field={richText} components={components} />;
}
