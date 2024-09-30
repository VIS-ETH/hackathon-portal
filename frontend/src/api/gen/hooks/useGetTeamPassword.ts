import type {
  GetTeamPassword500,
  GetTeamPasswordPathParams,
  GetTeamPasswordQueryResponse,
} from "../types/GetTeamPassword";

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

type GetTeamPasswordClient = typeof client<
  GetTeamPasswordQueryResponse,
  GetTeamPassword500,
  never
>;
type GetTeamPassword = {
  data: GetTeamPasswordQueryResponse;
  error: GetTeamPassword500;
  request: never;
  pathParams: GetTeamPasswordPathParams;
  queryParams: never;
  headerParams: never;
  response: GetTeamPasswordQueryResponse;
  client: {
    parameters: Partial<Parameters<GetTeamPasswordClient>[0]>;
    return: Awaited<ReturnType<GetTeamPasswordClient>>;
  };
};
export const getTeamPasswordQueryKey = (
  teamId: GetTeamPasswordPathParams["team_id"],
) =>
  [
    { url: "/api/teams/:team_id/password", params: { teamId: teamId } },
  ] as const;
export type GetTeamPasswordQueryKey = ReturnType<
  typeof getTeamPasswordQueryKey
>;
export function getTeamPasswordQueryOptions(
  teamId: GetTeamPasswordPathParams["team_id"],
  options: GetTeamPassword["client"]["parameters"] = {},
) {
  const queryKey = getTeamPasswordQueryKey(teamId);
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<
        GetTeamPassword["data"],
        GetTeamPassword["error"]
      >({
        method: "get",
        url: `/api/teams/${teamId}/password`,
        ...options,
      });
      return res;
    },
  });
}
/**
 * @link /api/teams/:team_id/password
 */
export function useGetTeamPassword<
  TData = GetTeamPassword["response"],
  TQueryData = GetTeamPassword["response"],
  TQueryKey extends QueryKey = GetTeamPasswordQueryKey,
>(
  teamId: GetTeamPasswordPathParams["team_id"],
  options: {
    query?: Partial<
      QueryObserverOptions<
        GetTeamPassword["response"],
        GetTeamPassword["error"],
        TData,
        TQueryData,
        TQueryKey
      >
    >;
    client?: GetTeamPassword["client"]["parameters"];
  } = {},
): UseQueryResult<TData, GetTeamPassword["error"]> & {
  queryKey: TQueryKey;
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getTeamPasswordQueryKey(teamId);
  const query = useQuery({
    ...(getTeamPasswordQueryOptions(
      teamId,
      clientOptions,
    ) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, "queryKey">),
  }) as UseQueryResult<TData, GetTeamPassword["error"]> & {
    queryKey: TQueryKey;
  };
  query.queryKey = queryKey as TQueryKey;
  return query;
}
export const getTeamPasswordSuspenseQueryKey = (
  teamId: GetTeamPasswordPathParams["team_id"],
) =>
  [
    { url: "/api/teams/:team_id/password", params: { teamId: teamId } },
  ] as const;
export type GetTeamPasswordSuspenseQueryKey = ReturnType<
  typeof getTeamPasswordSuspenseQueryKey
>;
export function getTeamPasswordSuspenseQueryOptions(
  teamId: GetTeamPasswordPathParams["team_id"],
  options: GetTeamPassword["client"]["parameters"] = {},
) {
  const queryKey = getTeamPasswordSuspenseQueryKey(teamId);
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<
        GetTeamPassword["data"],
        GetTeamPassword["error"]
      >({
        method: "get",
        url: `/api/teams/${teamId}/password`,
        ...options,
      });
      return res;
    },
  });
}
/**
 * @link /api/teams/:team_id/password
 */
export function useGetTeamPasswordSuspense<
  TData = GetTeamPassword["response"],
  TQueryKey extends QueryKey = GetTeamPasswordSuspenseQueryKey,
>(
  teamId: GetTeamPasswordPathParams["team_id"],
  options: {
    query?: Partial<
      UseSuspenseQueryOptions<
        GetTeamPassword["response"],
        GetTeamPassword["error"],
        TData,
        TQueryKey
      >
    >;
    client?: GetTeamPassword["client"]["parameters"];
  } = {},
): UseSuspenseQueryResult<TData, GetTeamPassword["error"]> & {
  queryKey: TQueryKey;
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {};
  const queryKey =
    queryOptions?.queryKey ?? getTeamPasswordSuspenseQueryKey(teamId);
  const query = useSuspenseQuery({
    ...(getTeamPasswordSuspenseQueryOptions(
      teamId,
      clientOptions,
    ) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, "queryKey">),
  }) as UseSuspenseQueryResult<TData, GetTeamPassword["error"]> & {
    queryKey: TQueryKey;
  };
  query.queryKey = queryKey as TQueryKey;
  return query;
}
