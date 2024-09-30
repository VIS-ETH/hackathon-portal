import type {
  GetTeams500,
  GetTeamsQueryParams,
  GetTeamsQueryResponse,
} from "../types/GetTeams";

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

type GetTeamsClient = typeof client<GetTeamsQueryResponse, GetTeams500, never>;
type GetTeams = {
  data: GetTeamsQueryResponse;
  error: GetTeams500;
  request: never;
  pathParams: never;
  queryParams: GetTeamsQueryParams;
  headerParams: never;
  response: GetTeamsQueryResponse;
  client: {
    parameters: Partial<Parameters<GetTeamsClient>[0]>;
    return: Awaited<ReturnType<GetTeamsClient>>;
  };
};
export const getTeamsQueryKey = (params: GetTeams["queryParams"]) =>
  [{ url: "/api/teams" }, ...(params ? [params] : [])] as const;
export type GetTeamsQueryKey = ReturnType<typeof getTeamsQueryKey>;
export function getTeamsQueryOptions(
  params: GetTeams["queryParams"],
  options: GetTeams["client"]["parameters"] = {},
) {
  const queryKey = getTeamsQueryKey(params);
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<GetTeams["data"], GetTeams["error"]>({
        method: "get",
        url: `/api/teams`,
        params,
        ...options,
      });
      return res;
    },
  });
}
/**
 * @link /api/teams
 */
export function useGetTeams<
  TData = GetTeams["response"],
  TQueryData = GetTeams["response"],
  TQueryKey extends QueryKey = GetTeamsQueryKey,
>(
  params: GetTeams["queryParams"],
  options: {
    query?: Partial<
      QueryObserverOptions<
        GetTeams["response"],
        GetTeams["error"],
        TData,
        TQueryData,
        TQueryKey
      >
    >;
    client?: GetTeams["client"]["parameters"];
  } = {},
): UseQueryResult<TData, GetTeams["error"]> & {
  queryKey: TQueryKey;
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getTeamsQueryKey(params);
  const query = useQuery({
    ...(getTeamsQueryOptions(
      params,
      clientOptions,
    ) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, "queryKey">),
  }) as UseQueryResult<TData, GetTeams["error"]> & {
    queryKey: TQueryKey;
  };
  query.queryKey = queryKey as TQueryKey;
  return query;
}
export const getTeamsSuspenseQueryKey = (params: GetTeams["queryParams"]) =>
  [{ url: "/api/teams" }, ...(params ? [params] : [])] as const;
export type GetTeamsSuspenseQueryKey = ReturnType<
  typeof getTeamsSuspenseQueryKey
>;
export function getTeamsSuspenseQueryOptions(
  params: GetTeams["queryParams"],
  options: GetTeams["client"]["parameters"] = {},
) {
  const queryKey = getTeamsSuspenseQueryKey(params);
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<GetTeams["data"], GetTeams["error"]>({
        method: "get",
        url: `/api/teams`,
        params,
        ...options,
      });
      return res;
    },
  });
}
/**
 * @link /api/teams
 */
export function useGetTeamsSuspense<
  TData = GetTeams["response"],
  TQueryKey extends QueryKey = GetTeamsSuspenseQueryKey,
>(
  params: GetTeams["queryParams"],
  options: {
    query?: Partial<
      UseSuspenseQueryOptions<
        GetTeams["response"],
        GetTeams["error"],
        TData,
        TQueryKey
      >
    >;
    client?: GetTeams["client"]["parameters"];
  } = {},
): UseSuspenseQueryResult<TData, GetTeams["error"]> & {
  queryKey: TQueryKey;
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getTeamsSuspenseQueryKey(params);
  const query = useSuspenseQuery({
    ...(getTeamsSuspenseQueryOptions(
      params,
      clientOptions,
    ) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, "queryKey">),
  }) as UseSuspenseQueryResult<TData, GetTeams["error"]> & {
    queryKey: TQueryKey;
  };
  query.queryKey = queryKey as TQueryKey;
  return query;
}
