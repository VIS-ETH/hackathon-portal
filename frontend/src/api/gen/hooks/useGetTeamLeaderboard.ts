import type {
  GetTeamLeaderboard500,
  GetTeamLeaderboardQueryParams,
  GetTeamLeaderboardQueryResponse,
} from "../types/GetTeamLeaderboard";

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

type GetTeamLeaderboardClient = typeof client<
  GetTeamLeaderboardQueryResponse,
  GetTeamLeaderboard500,
  never
>;
type GetTeamLeaderboard = {
  data: GetTeamLeaderboardQueryResponse;
  error: GetTeamLeaderboard500;
  request: never;
  pathParams: never;
  queryParams: GetTeamLeaderboardQueryParams;
  headerParams: never;
  response: GetTeamLeaderboardQueryResponse;
  client: {
    parameters: Partial<Parameters<GetTeamLeaderboardClient>[0]>;
    return: Awaited<ReturnType<GetTeamLeaderboardClient>>;
  };
};
export const getTeamLeaderboardQueryKey = (
  params: GetTeamLeaderboard["queryParams"],
) =>
  [
    { url: "/api/sidequests/leaderboard" },
    ...(params ? [params] : []),
  ] as const;
export type GetTeamLeaderboardQueryKey = ReturnType<
  typeof getTeamLeaderboardQueryKey
>;
export function getTeamLeaderboardQueryOptions(
  params: GetTeamLeaderboard["queryParams"],
  options: GetTeamLeaderboard["client"]["parameters"] = {},
) {
  const queryKey = getTeamLeaderboardQueryKey(params);
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<
        GetTeamLeaderboard["data"],
        GetTeamLeaderboard["error"]
      >({
        method: "get",
        url: `/api/sidequests/leaderboard`,
        params,
        ...options,
      });
      return res;
    },
  });
}
/**
 * @link /api/sidequests/leaderboard
 */
export function useGetTeamLeaderboard<
  TData = GetTeamLeaderboard["response"],
  TQueryData = GetTeamLeaderboard["response"],
  TQueryKey extends QueryKey = GetTeamLeaderboardQueryKey,
>(
  params: GetTeamLeaderboard["queryParams"],
  options: {
    query?: Partial<
      QueryObserverOptions<
        GetTeamLeaderboard["response"],
        GetTeamLeaderboard["error"],
        TData,
        TQueryData,
        TQueryKey
      >
    >;
    client?: GetTeamLeaderboard["client"]["parameters"];
  } = {},
): UseQueryResult<TData, GetTeamLeaderboard["error"]> & {
  queryKey: TQueryKey;
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getTeamLeaderboardQueryKey(params);
  const query = useQuery({
    ...(getTeamLeaderboardQueryOptions(
      params,
      clientOptions,
    ) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, "queryKey">),
  }) as UseQueryResult<TData, GetTeamLeaderboard["error"]> & {
    queryKey: TQueryKey;
  };
  query.queryKey = queryKey as TQueryKey;
  return query;
}
export const getTeamLeaderboardSuspenseQueryKey = (
  params: GetTeamLeaderboard["queryParams"],
) =>
  [
    { url: "/api/sidequests/leaderboard" },
    ...(params ? [params] : []),
  ] as const;
export type GetTeamLeaderboardSuspenseQueryKey = ReturnType<
  typeof getTeamLeaderboardSuspenseQueryKey
>;
export function getTeamLeaderboardSuspenseQueryOptions(
  params: GetTeamLeaderboard["queryParams"],
  options: GetTeamLeaderboard["client"]["parameters"] = {},
) {
  const queryKey = getTeamLeaderboardSuspenseQueryKey(params);
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<
        GetTeamLeaderboard["data"],
        GetTeamLeaderboard["error"]
      >({
        method: "get",
        url: `/api/sidequests/leaderboard`,
        params,
        ...options,
      });
      return res;
    },
  });
}
/**
 * @link /api/sidequests/leaderboard
 */
export function useGetTeamLeaderboardSuspense<
  TData = GetTeamLeaderboard["response"],
  TQueryKey extends QueryKey = GetTeamLeaderboardSuspenseQueryKey,
>(
  params: GetTeamLeaderboard["queryParams"],
  options: {
    query?: Partial<
      UseSuspenseQueryOptions<
        GetTeamLeaderboard["response"],
        GetTeamLeaderboard["error"],
        TData,
        TQueryKey
      >
    >;
    client?: GetTeamLeaderboard["client"]["parameters"];
  } = {},
): UseSuspenseQueryResult<TData, GetTeamLeaderboard["error"]> & {
  queryKey: TQueryKey;
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {};
  const queryKey =
    queryOptions?.queryKey ?? getTeamLeaderboardSuspenseQueryKey(params);
  const query = useSuspenseQuery({
    ...(getTeamLeaderboardSuspenseQueryOptions(
      params,
      clientOptions,
    ) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, "queryKey">),
  }) as UseSuspenseQueryResult<TData, GetTeamLeaderboard["error"]> & {
    queryKey: TQueryKey;
  };
  query.queryKey = queryKey as TQueryKey;
  return query;
}
