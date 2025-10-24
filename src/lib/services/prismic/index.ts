import * as prismicLib from "@prismicio/client";
import {
  PRISMIC_ACCESS_TOKEN,
  PRISMIC_REPOSITORY_NAME,
} from "@/lib/services/env/private";

export const prismicClient = prismicLib.createClient(PRISMIC_REPOSITORY_NAME, {
  accessToken: PRISMIC_ACCESS_TOKEN,
});
export const prismic = prismicLib;
