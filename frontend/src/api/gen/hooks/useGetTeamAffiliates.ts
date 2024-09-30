import type {
  GetTeamAffiliates500,
  GetTeamAffiliatesPathParams,
  GetTeamAffiliatesQueryParams,
  GetTeamAffiliatesQueryResponse,
} from "../types/GetTeamAffiliates";

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

type GetTeamAffiliatesClient = typeof client<
  GetTeamAffiliatesQueryResponse,
  GetTeamAffiliates500,
  never
>;
type GetTeamAffiliates = {
  data: GetTeamAffiliatesQueryResponse;
  error: GetTeamAffiliates500;
  request: never;
  pathParams: GetTeamAffiliatesPathParams;
  queryParams: GetTeamAffiliatesQueryParams;
  headerParams: never;
  response: GetTeamAffiliatesQueryResponse;
  client: {
    parameters: Partial<Parameters<GetTeamAffiliatesClient>[0]>;
    return: Awaited<ReturnType<GetTeamAffiliatesClient>>;
  };
};
export const getTeamAffiliatesQueryKey = (
  teamId: GetTeamAffiliatesPathParams["team_id"],
  params?: GetTeamAffiliates["queryParams"],
) =>
  [
    { url: "/api/teams/:team_id/affiliates", params: { teamId: teamId } },
    ...(params ? [params] : []),
  ] as const;
export type GetTeamAffiliatesQueryKey = ReturnType<
  typeof getTeamAffiliatesQueryKey
>;
export function getTeamAffiliatesQueryOptions(
  teamId: GetTeamAffiliatesPathParams["team_id"],
  params?: GetTeamAffiliates["queryParams"],
  options: GetTeamAffiliates["client"]["parameters"] = {},
) {
  const queryKey = getTeamAffiliatesQueryKey(teamId, params);
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<
        GetTeamAffiliates["data"],
        GetTeamAffiliates["error"]
      >({
        method: "get",
        url: `/api/teams/${teamId}/affiliates`,
        params,
        ...options,
      });
      return res;
    },
  });
}
/**
 * @link /api/teams/:team_id/affiliates
 */
export function useGetTeamAffiliates<
  TData = GetTeamAffiliates["response"],
  TQueryData = GetTeamAffiliates["response"],
  TQueryKey extends QueryKey = GetTeamAffiliatesQueryKey,
>(
  teamId: GetTeamAffiliatesPathParams["team_id"],
  params?: GetTeamAffiliates["queryParams"],
  options: {
    query?: Partial<
      QueryObserverOptions<
        GetTeamAffiliates["response"],
        GetTeamAffiliates["error"],
        TData,
        TQueryData,
        TQueryKey
      >
    >;
    client?: GetTeamAffiliates["client"]["parameters"];
  } = {},
): UseQueryResult<TData, GetTeamAffiliates["error"]> & {
  queryKey: TQueryKey;
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {};
  const queryKey =
    queryOptions?.queryKey ?? getTeamAffiliatesQueryKey(teamId, params);
  const query = useQuery({
    ...(getTeamAffiliatesQueryOptions(
      teamId,
      params,
      clientOptions,
    ) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, "queryKey">),
  }) as UseQueryResult<TData, GetTeamAffiliates["error"]> & {
    queryKey: TQueryKey;
  };
  query.queryKey = queryKey as TQueryKey;
  return query;
}
export const getTeamAffiliatesSuspenseQueryKey = (
  teamId: GetTeamAffiliatesPathParams["team_id"],
  params?: GetTeamAffiliates["queryParams"],
) =>
  [
    { url: "/api/teams/:team_id/affiliates", params: { teamId: teamId } },
    ...(params ? [params] : []),
  ] as const;
export type GetTeamAffiliatesSuspenseQueryKey = ReturnType<
  typeof getTeamAffiliatesSuspenseQueryKey
>;
export function getTeamAffiliatesSuspenseQueryOptions(
  teamId: GetTeamAffiliatesPathParams["team_id"],
  params?: GetTeamAffiliates["queryParams"],
  options: GetTeamAffiliates["client"]["parameters"] = {},
) {
  const queryKey = getTeamAffiliatesSuspenseQueryKey(teamId, params);
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<
        GetTeamAffiliates["data"],
        GetTeamAffiliates["error"]
      >({
        method: "get",
        url: `/api/teams/${teamId}/affiliates`,
        params,
        ...options,
      });
      return res;
    },
  });
}
/**
 * @link /api/teams/:team_id/affiliates
 */
export function useGetTeamAffiliatesSuspense<
  TData = GetTeamAffiliates["response"],
  TQueryKey extends QueryKey = GetTeamAffiliatesSuspenseQueryKey,
>(
  teamId: GetTeamAffiliatesPathParams["team_id"],
  params?: GetTeamAffiliates["queryParams"],
  options: {
    query?: Partial<
      UseSuspenseQueryOptions<
        GetTeamAffiliates["response"],
        GetTeamAffiliates["error"],
        TData,
        TQueryKey
      >
    >;
    client?: GetTeamAffiliates["client"]["parameters"];
  } = {},
): UseSuspenseQueryResult<TData, GetTeamAffiliates["error"]> & {
  queryKey: TQueryKey;
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {};
  const queryKey =
    queryOptions?.queryKey ?? getTeamAffiliatesSuspenseQueryKey(teamId, params);
  const query = useSuspenseQuery({
    ...(getTeamAffiliatesSuspenseQueryOptions(
      teamId,
      params,
      clientOptions,
    ) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, "queryKey">),
  }) as UseSuspenseQueryResult<TData, GetTeamAffiliates["error"]> & {
    queryKey: TQueryKey;
  };
  query.queryKey = queryKey as TQueryKey;
  return query;
}
