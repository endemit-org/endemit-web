import "server-only";

import { unstable_cache } from "next/cache";
import type { CacheTag } from "./tags";

/**
 * Cache Wrapper Utilities
 *
 * Helpers for wrapping operations with unstable_cache.
 */

type CacheOptions = {
  /** Cache tags for invalidation */
  tags: CacheTag[];
  /** Optional time-based revalidation (seconds). Default: no TTL (tag-based only) */
  revalidate?: number | false;
};

/**
 * Wrap an async function with cache
 *
 * @example
 * ```ts
 * const getTicketsByUserIdCached = withCache(
 *   getTicketsByUserIdUncached,
 *   (userId) => ({
 *     tags: [CacheTags.user.tickets(userId)],
 *   }),
 *   (userId) => [`tickets-user-${userId}`]
 * );
 * ```
 */
export function withCache<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  getOptions: (...args: TArgs) => CacheOptions,
  getCacheKey: (...args: TArgs) => string[]
): (...args: TArgs) => Promise<TResult> {
  return (...args: TArgs) => {
    const options = getOptions(...args);
    const cacheKey = getCacheKey(...args);

    return unstable_cache(
      () => fn(...args),
      cacheKey,
      {
        tags: options.tags,
        revalidate: options.revalidate,
      }
    )();
  };
}

/**
 * Create a cached version of a function with static options
 *
 * @example
 * ```ts
 * const getOrderStatsCached = createCachedFn(
 *   getOrderStatsUncached,
 *   {
 *     tags: [CacheTags.admin.orders.stats()],
 *   },
 *   ['order-stats']
 * );
 * ```
 */
export function createCachedFn<TResult>(
  fn: () => Promise<TResult>,
  options: CacheOptions,
  cacheKey: string[]
): () => Promise<TResult> {
  return () =>
    unstable_cache(fn, cacheKey, {
      tags: options.tags,
      revalidate: options.revalidate,
    })();
}

/**
 * Create a cached version of a function with one argument
 *
 * @example
 * ```ts
 * const getTicketsByUserIdCached = createCachedFnWithArg(
 *   getTicketsByUserIdUncached,
 *   (userId) => ({
 *     tags: [CacheTags.user.tickets(userId)],
 *   }),
 *   (userId) => ['tickets-user', userId]
 * );
 * ```
 */
export function createCachedFnWithArg<TArg, TResult>(
  fn: (arg: TArg) => Promise<TResult>,
  getOptions: (arg: TArg) => CacheOptions,
  getCacheKey: (arg: TArg) => string[]
): (arg: TArg) => Promise<TResult> {
  return (arg: TArg) => {
    const options = getOptions(arg);
    const cacheKey = getCacheKey(arg);

    return unstable_cache(
      () => fn(arg),
      cacheKey,
      {
        tags: options.tags,
        revalidate: options.revalidate,
      }
    )();
  };
}

/**
 * Create a cached version of a function with two arguments
 *
 * @example
 * ```ts
 * const getTicketsForEventCached = createCachedFnWithArgs2(
 *   getTicketsForEventUncached,
 *   (eventId, limit) => ({
 *     tags: [CacheTags.admin.tickets.forEvent(eventId)],
 *   }),
 *   (eventId, limit) => ['tickets-event', eventId, String(limit)]
 * );
 * ```
 */
export function createCachedFnWithArgs2<TArg1, TArg2, TResult>(
  fn: (arg1: TArg1, arg2: TArg2) => Promise<TResult>,
  getOptions: (arg1: TArg1, arg2: TArg2) => CacheOptions,
  getCacheKey: (arg1: TArg1, arg2: TArg2) => string[]
): (arg1: TArg1, arg2: TArg2) => Promise<TResult> {
  return (arg1: TArg1, arg2: TArg2) => {
    const options = getOptions(arg1, arg2);
    const cacheKey = getCacheKey(arg1, arg2);

    return unstable_cache(
      () => fn(arg1, arg2),
      cacheKey,
      {
        tags: options.tags,
        revalidate: options.revalidate,
      }
    )();
  };
}

/**
 * Create a cached version with options object argument
 *
 * @example
 * ```ts
 * const getAllOrdersCached = createCachedFnWithOptions(
 *   getAllOrdersUncached,
 *   (opts) => ({
 *     tags: [CacheTags.admin.orders.list()],
 *   }),
 *   (opts) => ['orders', String(opts.page), String(opts.pageSize)]
 * );
 * ```
 */
export function createCachedFnWithOptions<TOptions extends object, TResult>(
  fn: (options: TOptions) => Promise<TResult>,
  getTagOptions: (options: TOptions) => CacheOptions,
  getCacheKey: (options: TOptions) => string[]
): (options: TOptions) => Promise<TResult> {
  return (options: TOptions) => {
    const tagOptions = getTagOptions(options);
    const cacheKey = getCacheKey(options);

    return unstable_cache(
      () => fn(options),
      cacheKey,
      {
        tags: tagOptions.tags,
        revalidate: tagOptions.revalidate,
      }
    )();
  };
}
