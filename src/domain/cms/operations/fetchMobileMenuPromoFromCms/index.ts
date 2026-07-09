import "server-only";

import { prismicClient } from "@/lib/services/prismic";
import type { MobileMenuPromoDocument } from "@/prismicio-types";

export interface MobileMenuPromo {
  dismissable: boolean;
  slices: MobileMenuPromoDocument["data"]["slices"];
}

/**
 * The promo shown in the open mobile menu. Null when the document doesn't
 * exist or the `published` toggle is off — the menu then renders no promo.
 */
export const fetchMobileMenuPromoFromCms =
  async (): Promise<MobileMenuPromo | null> => {
    const doc = await prismicClient
      .getSingle("mobile_menu_promo")
      .catch(() => null);

    if (!doc || !doc.data.published) {
      return null;
    }

    return {
      dismissable: doc.data.dismissable === true,
      slices: doc.data.slices,
    };
  };
