import { JSXMapSerializer, PrismicRichText } from "@prismicio/react";
import { RichTextField } from "@prismicio/client";
import Link from "next/link";
import ImageWithFallback from "@/app/_components/content/ImageWithFallback";

interface Props {
  richText?: RichTextField | null;
}

const components: JSXMapSerializer = {
  heading1: ({ children }) => (
    <h1 className="text-4xl font-bold first:pt-0">{children}</h1>
  ),
  heading2: ({ children }) => (
    <h2 className="text-3xl font-semibold pt-12">{children}</h2>
  ),

  image: ({ node }) => {
    const image = (
      <ImageWithFallback
        src={node.url}
        width={800}
        height={800}
        className={"my-6 w-full"}
      />
    );

    return (
      <div className={"w-full"}>
        {node.linkTo ? (
          <Link
            href={node.linkTo.url!}
            className="link"
            target={node.linkTo.url?.startsWith("http") ? "_blank" : "_self"}
          >
            {image}
          </Link>
        ) : (
          image
        )}
      </div>
    );
  },
  paragraph: ({ children }) => <p className="mb-4">{children}</p>,
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
