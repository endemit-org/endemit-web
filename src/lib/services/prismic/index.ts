import * as prismicLib from "@prismicio/client";
import { enableAutoPreviews } from "@prismicio/next";
import {
  PRISMIC_ACCESS_TOKEN,
  PRISMIC_REPOSITORY_NAME,
} from "@/lib/services/env/private";

const prismicClientObject = prismicLib.createClient(PRISMIC_REPOSITORY_NAME, {
  accessToken: PRISMIC_ACCESS_TOKEN,
});

// Prismic previews: while Next draft mode is on (set by the preview route),
// every query reads the draft ref from the preview cookie instead of the
// published content. Outside draft mode, and outside a request (builds,
// background jobs), this is a no-op.
enableAutoPreviews({ client: prismicClientObject });

export const prismicClient = prismicClientObject;
export const prismic = prismicLib;
