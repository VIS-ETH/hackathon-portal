import type {
  GetTeamRoles500,
  GetTeamRolesPathParams,
  GetTeamRolesQueryResponse,
} from "../types/GetTeamRoles";

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

type GetTeamRolesClient = typeof client<
  GetTeamRolesQueryResponse,
  GetTeamRoles500,
  never
>;
type GetTeamRoles = {
  data: GetTeamRolesQueryResponse;
  error: GetTeamRoles500;
  request: never;
  pathParams: GetTeamRolesPathParams;
  queryParams: never;
  headerParams: never;
  response: GetTeamRolesQueryResponse;
  client: {
    parameters: Partial<Parameters<GetTeamRolesClient>[0]>;
    return: Awaited<ReturnType<GetTeamRolesClient>>;
  };
};
export const getTeamRolesQueryKey = (
  teamId: GetTeamRolesPathParams["team_id"],
) =>
  [{ url: "/api/teams/:team_id/roles", params: { teamId: teamId } }] as const;
export type GetTeamRolesQueryKey = ReturnType<typeof getTeamRolesQueryKey>;
export function getTeamRolesQueryOptions(
  teamId: GetTeamRolesPathParams["team_id"],
  options: GetTeamRoles["client"]["parameters"] = {},
) {
  const queryKey = getTeamRolesQueryKey(teamId);
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<GetTeamRoles["data"], GetTeamRoles["error"]>({
        method: "get",
        url: `/api/teams/${teamId}/roles`,
        ...options,
      });
      return res;
    },
  });
}
/**
 * @link /api/teams/:team_id/roles
 */
export function useGetTeamRoles<
  TData = GetTeamRoles["response"],
  TQueryData = GetTeamRoles["response"],
  TQueryKey extends QueryKey = GetTeamRolesQueryKey,
>(
  teamId: GetTeamRolesPathParams["team_id"],
  options: {
    query?: Partial<
      QueryObserverOptions<
        GetTeamRoles["response"],
        GetTeamRoles["error"],
        TData,
        TQueryData,
        TQueryKey
      >
    >;
    client?: GetTeamRoles["client"]["parameters"];
  } = {},
): UseQueryResult<TData, GetTeamRoles["error"]> & {
  queryKey: TQueryKey;
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getTeamRolesQueryKey(teamId);
  const query = useQuery({
    ...(getTeamRolesQueryOptions(
      teamId,
      clientOptions,
    ) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, "queryKey">),
  }) as UseQueryResult<TData, GetTeamRoles["error"]> & {
    queryKey: TQueryKey;
  };
  query.queryKey = queryKey as TQueryKey;
  return query;
}
export const getTeamRolesSuspenseQueryKey = (
  teamId: GetTeamRolesPathParams["team_id"],
) =>
  [{ url: "/api/teams/:team_id/roles", params: { teamId: teamId } }] as const;
export type GetTeamRolesSuspenseQueryKey = ReturnType<
  typeof getTeamRolesSuspenseQueryKey
>;
export function getTeamRolesSuspenseQueryOptions(
  teamId: GetTeamRolesPathParams["team_id"],
  options: GetTeamRoles["client"]["parameters"] = {},
) {
  const queryKey = getTeamRolesSuspenseQueryKey(teamId);
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<GetTeamRoles["data"], GetTeamRoles["error"]>({
        method: "get",
        url: `/api/teams/${teamId}/roles`,
        ...options,
      });
      return res;
    },
  });
}
/**
 * @link /api/teams/:team_id/roles
 */
export function useGetTeamRolesSuspense<
  TData = GetTeamRoles["response"],
  TQueryKey extends QueryKey = GetTeamRolesSuspenseQueryKey,
>(
  teamId: GetTeamRolesPathParams["team_id"],
  options: {
    query?: Partial<
      UseSuspenseQueryOptions<
        GetTeamRoles["response"],
        GetTeamRoles["error"],
        TData,
        TQueryKey
      >
    >;
    client?: GetTeamRoles["client"]["parameters"];
  } = {},
): UseSuspenseQueryResult<TData, GetTeamRoles["error"]> & {
  queryKey: TQueryKey;
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {};
  const queryKey =
    queryOptions?.queryKey ?? getTeamRolesSuspenseQueryKey(teamId);
  const query = useSuspenseQuery({
    ...(getTeamRolesSuspenseQueryOptions(
      teamId,
      clientOptions,
    ) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, "queryKey">),
  }) as UseSuspenseQueryResult<TData, GetTeamRoles["error"]> & {
    queryKey: TQueryKey;
  };
  query.queryKey = queryKey as TQueryKey;
  return query;
}
