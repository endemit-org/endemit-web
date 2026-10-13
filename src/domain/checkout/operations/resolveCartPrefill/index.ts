import "server-only";

import { prismic } from "@/lib/services/prismic";
import { fetchProductsFromCms } from "@/domain/cms/operations/fetchProductsFromCms";
import {
  canProductExistInCart,
  isProductSellable,
  isProductVisible,
} from "@/domain/product/businessLogic";
import type { Product } from "@/domain/product/types/product";
import type { AppLocale } from "@/i18n/routing";
import {
  parseCartPrefill,
  parseDiscountCodeParam,
} from "@/domain/checkout/operations/parseCartPrefill";

/**
 * Resolves a shareable pre-filled checkout link into real products.
 *
 * Resolution happens on the server so the uids in the link are checked
 * against the CMS before any of it reaches the browser: a link may be months
 * old, hand-edited, or point at a product that has since been hidden, sold
 * out or passed its sales cutoff. Those entries are dropped here rather than
 * being added to a cart the customer then cannot check out with.
 *
 * The discount code is deliberately *not* validated here. It travels to the
 * client as a plain string and goes through the same
 * `POST /api/v1/checkout/promo-code` endpoint a typed code does, because
 * validity depends on the resulting cart (qualifying items, minimum order
 * value) and on usage counts at the moment of checkout.
 */

export interface ResolvedPrefillItem {
  product: Product;
  quantity: number;
}

export interface ResolvedCartPrefill {
  items: ResolvedPrefillItem[];
  discountCode?: string;
  /**
   * Uids in the link that resolved to nothing sellable. Logged server-side so
   * a stale shared link or QR code can be diagnosed from the logs.
   */
  unavailableUids: string[];
}

export async function resolveCartPrefill({
  cartParam,
  codeParam,
  locale,
}: {
  cartParam?: string | null;
  codeParam?: string | null;
  locale: AppLocale;
}): Promise<ResolvedCartPrefill | null> {
  const requested = parseCartPrefill(cartParam);
  const discountCode = parseDiscountCodeParam(codeParam);

  // A link may carry only a code, to be applied to whatever is in the cart.
  if (requested.length === 0) {
    return discountCode ? { items: [], discountCode, unavailableUids: [] } : null;
  }

  const products = await fetchProductsFromCms({
    filters: [
      prismic.filter.in(
        "my.product.uid",
        requested.map(item => item.uid)
      ),
    ],
    locale,
  });

  const byUid = new Map((products ?? []).map(product => [product.uid, product]));

  const items: ResolvedPrefillItem[] = [];
  const unavailableUids: string[] = [];

  // Link order is preserved, so the cart reads the way the sender wrote it.
  for (const { uid, quantity } of requested) {
    const product = byUid.get(uid);

    // The same three gates the shop itself applies — a link must not be a
    // back door into buying something that is hidden, unsellable, or a
    // composite placeholder that cannot sit in a cart.
    if (
      !product ||
      !isProductVisible(product) ||
      !isProductSellable(product) ||
      !canProductExistInCart(product)
    ) {
      unavailableUids.push(uid);
      continue;
    }

    items.push({ product, quantity });
  }

  if (unavailableUids.length > 0) {
    // Worth knowing about: it usually means a printed QR or a link shared in
    // a message now points at a product that was hidden or sold out.
    console.warn("Checkout prefill link had unavailable products", {
      unavailableUids,
      requested: requested.map(item => item.uid),
    });
  }

  if (items.length === 0 && !discountCode) {
    return null;
  }

  return { items, discountCode, unavailableUids };
}
