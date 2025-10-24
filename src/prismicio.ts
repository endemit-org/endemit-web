import {
  createClient as baseCreateClient,
  type ClientConfig,
  type Route,
} from "@prismicio/client";
import { enableAutoPreviews } from "@prismicio/next";
import sm from "../slicemachine.config.json";
import { PRISMIC_REPOSITORY_NAME } from "@/lib/services/env/private";
import { isProduction } from "@/lib/util/env";

/**
 * The project's Prismic repository name.
 */
export const repositoryName = PRISMIC_REPOSITORY_NAME || sm.repositoryName;

/**
 * A list of Route Resolver objects that define how a document's `url` field is resolved.
 *
 * {@link https://prismic.io/docs/route-resolver#route-resolver}
 */

const routes: Route[] = [
  {
    type: "home_page",
    path: "/",
  },
  {
    type: "content_page",
    path: "/:uid",
  },
  {
    type: "venue",
    path: "/venues/:uid",
  },
  {
    type: "event",
    path: "/events/:uid",
  },
  {
    type: "artist",
    path: "/artists/:uid",
  },
  {
    type: "product",
    path: "/product/:uid",
  },
  {
    type: "podcast",
    path: "/music/podcast/:uid",
  },
];

/**
 * Creates a Prismic client for the project's repository. The client is used to
 * query content from the Prismic API.
 *
 * @param config - Configuration for the Prismic client.
 */
export const createClient = (config: ClientConfig = {}) => {
  const client = baseCreateClient(repositoryName, {
    routes,
    fetchOptions: isProduction()
      ? { next: { tags: ["prismic"] }, cache: "force-cache" }
      : { next: { revalidate: 5 } },
    ...config,
  });

  enableAutoPreviews({ client });

  return client;
};
