import { NextRequest } from "next/server";
import { redirectToPreviewURL } from "@prismicio/next";
import type { LinkResolverFunction } from "@prismicio/client";

import { createClient } from "@/prismicio";
import { getProductLink } from "@/domain/product/actions/getProductLink";
import type { ProductCategory } from "@/domain/product/types/product";

/**
 * Where a previewed document lives on the site, for types whose URL can't be
 * expressed as a route. Everything else falls back to the client's `routes`.
 */
const linkResolver: LinkResolverFunction = doc => {
  if (doc.type === "product" && doc.uid) {
    const category = (doc.data as { product_category?: unknown } | undefined)
      ?.product_category;

    return typeof category === "string" && category
      ? getProductLink(doc.uid, category as ProductCategory)
      : "/store";
  }

  return null;
};

/**
 * Prismic preview entry point (configured in Prismic → Settings → Previews).
 * Turns on Next draft mode and redirects to the previewed document's page.
 */
export async function GET(request: NextRequest) {
  const client = createClient();

  return await redirectToPreviewURL({ client, request, linkResolver });
}
