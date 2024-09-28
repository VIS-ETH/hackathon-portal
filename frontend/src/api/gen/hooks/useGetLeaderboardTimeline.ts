import type {
  GetLeaderboardTimeline500,
  GetLeaderboardTimelineQueryParams,
  GetLeaderboardTimelineQueryResponse,
} from "../types/GetLeaderboardTimeline";

import client from "@/api/client";

import {
  queryOptions,
  useQuery,
  useSuspenseQuery,
} from "@tanstack/react-query";
import type {
  QueryKey,
  QueryObserverOptions,
  UseQueryResult,
  UseSuspenseQueryOptions,
  UseSuspenseQueryResult,
} from "@tanstack/react-query";

type GetLeaderboardTimelineClient = typeof client<
  GetLeaderboardTimelineQueryResponse,
  GetLeaderboardTimeline500,
  never
>;
type GetLeaderboardTimeline = {
  data: GetLeaderboardTimelineQueryResponse;
  error: GetLeaderboardTimeline500;
  request: never;
  pathParams: never;
  queryParams: GetLeaderboardTimelineQueryParams;
  headerParams: never;
  response: GetLeaderboardTimelineQueryResponse;
  client: {
    parameters: Partial<Parameters<GetLeaderboardTimelineClient>[0]>;
    return: Awaited<ReturnType<GetLeaderboardTimelineClient>>;
  };
};
export const getLeaderboardTimelineQueryKey = (
  params: GetLeaderboardTimeline["queryParams"],
) =>
  [
    { url: "/api/sidequests/leaderboard/timeline" },
    ...(params ? [params] : []),
  ] as const;
export type GetLeaderboardTimelineQueryKey = ReturnType<
  typeof getLeaderboardTimelineQueryKey
>;
export function getLeaderboardTimelineQueryOptions(
  params: GetLeaderboardTimeline["queryParams"],
  options: GetLeaderboardTimeline["client"]["parameters"] = {},
) {
  const queryKey = getLeaderboardTimelineQueryKey(params);
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<
        GetLeaderboardTimeline["data"],
        GetLeaderboardTimeline["error"]
      >({
        method: "get",
        url: `/api/sidequests/leaderboard/timeline`,
        params,
        ...options,
      });
      return res;
    },
  });
}
/**
 * @link /api/sidequests/leaderboard/timeline
 */
export function useGetLeaderboardTimeline<
  TData = GetLeaderboardTimeline["response"],
  TQueryData = GetLeaderboardTimeline["response"],
  TQueryKey extends QueryKey = GetLeaderboardTimelineQueryKey,
>(
  params: GetLeaderboardTimeline["queryParams"],
  options: {
    query?: Partial<
      QueryObserverOptions<
        GetLeaderboardTimeline["response"],
        GetLeaderboardTimeline["error"],
        TData,
        TQueryData,
        TQueryKey
      >
    >;
    client?: GetLeaderboardTimeline["client"]["parameters"];
  } = {},
): UseQueryResult<TData, GetLeaderboardTimeline["error"]> & {
  queryKey: TQueryKey;
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {};
  const queryKey =
    queryOptions?.queryKey ?? getLeaderboardTimelineQueryKey(params);
  const query = useQuery({
    ...(getLeaderboardTimelineQueryOptions(
      params,
      clientOptions,
    ) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, "queryKey">),
  }) as UseQueryResult<TData, GetLeaderboardTimeline["error"]> & {
    queryKey: TQueryKey;
  };
  query.queryKey = queryKey as TQueryKey;
  return query;
}
export const getLeaderboardTimelineSuspenseQueryKey = (
  params: GetLeaderboardTimeline["queryParams"],
) =>
  [
    { url: "/api/sidequests/leaderboard/timeline" },
    ...(params ? [params] : []),
  ] as const;
export type GetLeaderboardTimelineSuspenseQueryKey = ReturnType<
  typeof getLeaderboardTimelineSuspenseQueryKey
>;
export function getLeaderboardTimelineSuspenseQueryOptions(
  params: GetLeaderboardTimeline["queryParams"],
  options: GetLeaderboardTimeline["client"]["parameters"] = {},
) {
  const queryKey = getLeaderboardTimelineSuspenseQueryKey(params);
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<
        GetLeaderboardTimeline["data"],
        GetLeaderboardTimeline["error"]
      >({
        method: "get",
        url: `/api/sidequests/leaderboard/timeline`,
        params,
        ...options,
      });
      return res;
    },
  });
}
/**
 * @link /api/sidequests/leaderboard/timeline
 */
export function useGetLeaderboardTimelineSuspense<
  TData = GetLeaderboardTimeline["response"],
  TQueryKey extends QueryKey = GetLeaderboardTimelineSuspenseQueryKey,
>(
  params: GetLeaderboardTimeline["queryParams"],
  options: {
    query?: Partial<
      UseSuspenseQueryOptions<
        GetLeaderboardTimeline["response"],
        GetLeaderboardTimeline["error"],
        TData,
        TQueryKey
      >
    >;
    client?: GetLeaderboardTimeline["client"]["parameters"];
  } = {},
): UseSuspenseQueryResult<TData, GetLeaderboardTimeline["error"]> & {
  queryKey: TQueryKey;
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {};
  const queryKey =
    queryOptions?.queryKey ?? getLeaderboardTimelineSuspenseQueryKey(params);
  const query = useSuspenseQuery({
    ...(getLeaderboardTimelineSuspenseQueryOptions(
      params,
      clientOptions,
    ) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, "queryKey">),
  }) as UseSuspenseQueryResult<TData, GetLeaderboardTimeline["error"]> & {
    queryKey: TQueryKey;
  };
  query.queryKey = queryKey as TQueryKey;
  return query;
}
