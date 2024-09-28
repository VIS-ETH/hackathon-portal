import type {
  GetLeaderboard500,
  GetLeaderboardPathParams,
  GetLeaderboardQueryResponse,
} from "../types/GetLeaderboard";

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

type GetLeaderboardClient = typeof client<
  GetLeaderboardQueryResponse,
  GetLeaderboard500,
  never
>;
type GetLeaderboard = {
  data: GetLeaderboardQueryResponse;
  error: GetLeaderboard500;
  request: never;
  pathParams: GetLeaderboardPathParams;
  queryParams: never;
  headerParams: never;
  response: GetLeaderboardQueryResponse;
  client: {
    parameters: Partial<Parameters<GetLeaderboardClient>[0]>;
    return: Awaited<ReturnType<GetLeaderboardClient>>;
  };
};
export const getLeaderboardQueryKey = (
  sidequestId: GetLeaderboardPathParams["sidequest_id"],
) =>
  [
    {
      url: "/api/sidequests/:sidequest_id/leaderboard",
      params: { sidequestId: sidequestId },
    },
  ] as const;
export type GetLeaderboardQueryKey = ReturnType<typeof getLeaderboardQueryKey>;
export function getLeaderboardQueryOptions(
  sidequestId: GetLeaderboardPathParams["sidequest_id"],
  options: GetLeaderboard["client"]["parameters"] = {},
) {
  const queryKey = getLeaderboardQueryKey(sidequestId);
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<GetLeaderboard["data"], GetLeaderboard["error"]>(
        {
          method: "get",
          url: `/api/sidequests/${sidequestId}/leaderboard`,
          ...options,
        },
      );
      return res;
    },
  });
}
/**
 * @link /api/sidequests/:sidequest_id/leaderboard
 */
export function useGetLeaderboard<
  TData = GetLeaderboard["response"],
  TQueryData = GetLeaderboard["response"],
  TQueryKey extends QueryKey = GetLeaderboardQueryKey,
>(
  sidequestId: GetLeaderboardPathParams["sidequest_id"],
  options: {
    query?: Partial<
      QueryObserverOptions<
        GetLeaderboard["response"],
        GetLeaderboard["error"],
        TData,
        TQueryData,
        TQueryKey
      >
    >;
    client?: GetLeaderboard["client"]["parameters"];
  } = {},
): UseQueryResult<TData, GetLeaderboard["error"]> & {
  queryKey: TQueryKey;
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {};
  const queryKey =
    queryOptions?.queryKey ?? getLeaderboardQueryKey(sidequestId);
  const query = useQuery({
    ...(getLeaderboardQueryOptions(
      sidequestId,
      clientOptions,
    ) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, "queryKey">),
  }) as UseQueryResult<TData, GetLeaderboard["error"]> & {
    queryKey: TQueryKey;
  };
  query.queryKey = queryKey as TQueryKey;
  return query;
}
export const getLeaderboardSuspenseQueryKey = (
  sidequestId: GetLeaderboardPathParams["sidequest_id"],
) =>
  [
    {
      url: "/api/sidequests/:sidequest_id/leaderboard",
      params: { sidequestId: sidequestId },
    },
  ] as const;
export type GetLeaderboardSuspenseQueryKey = ReturnType<
  typeof getLeaderboardSuspenseQueryKey
>;
export function getLeaderboardSuspenseQueryOptions(
  sidequestId: GetLeaderboardPathParams["sidequest_id"],
  options: GetLeaderboard["client"]["parameters"] = {},
) {
  const queryKey = getLeaderboardSuspenseQueryKey(sidequestId);
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<GetLeaderboard["data"], GetLeaderboard["error"]>(
        {
          method: "get",
          url: `/api/sidequests/${sidequestId}/leaderboard`,
          ...options,
        },
      );
      return res;
    },
  });
}
/**
 * @link /api/sidequests/:sidequest_id/leaderboard
 */
export function useGetLeaderboardSuspense<
  TData = GetLeaderboard["response"],
  TQueryKey extends QueryKey = GetLeaderboardSuspenseQueryKey,
>(
  sidequestId: GetLeaderboardPathParams["sidequest_id"],
  options: {
    query?: Partial<
      UseSuspenseQueryOptions<
        GetLeaderboard["response"],
        GetLeaderboard["error"],
        TData,
        TQueryKey
      >
    >;
    client?: GetLeaderboard["client"]["parameters"];
  } = {},
): UseSuspenseQueryResult<TData, GetLeaderboard["error"]> & {
  queryKey: TQueryKey;
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {};
  const queryKey =
    queryOptions?.queryKey ?? getLeaderboardSuspenseQueryKey(sidequestId);
  const query = useSuspenseQuery({
    ...(getLeaderboardSuspenseQueryOptions(
      sidequestId,
      clientOptions,
    ) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, "queryKey">),
  }) as UseSuspenseQueryResult<TData, GetLeaderboard["error"]> & {
    queryKey: TQueryKey;
  };
  query.queryKey = queryKey as TQueryKey;
  return query;
}
