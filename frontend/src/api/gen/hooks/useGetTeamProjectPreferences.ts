import type {
  GetTeamProjectPreferences500,
  GetTeamProjectPreferencesPathParams,
  GetTeamProjectPreferencesQueryResponse,
} from "../types/GetTeamProjectPreferences";

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

type GetTeamProjectPreferencesClient = typeof client<
  GetTeamProjectPreferencesQueryResponse,
  GetTeamProjectPreferences500,
  never
>;
type GetTeamProjectPreferences = {
  data: GetTeamProjectPreferencesQueryResponse;
  error: GetTeamProjectPreferences500;
  request: never;
  pathParams: GetTeamProjectPreferencesPathParams;
  queryParams: never;
  headerParams: never;
  response: GetTeamProjectPreferencesQueryResponse;
  client: {
    parameters: Partial<Parameters<GetTeamProjectPreferencesClient>[0]>;
    return: Awaited<ReturnType<GetTeamProjectPreferencesClient>>;
  };
};
export const getTeamProjectPreferencesQueryKey = (
  teamId: GetTeamProjectPreferencesPathParams["team_id"],
) =>
  [
    {
      url: "/api/teams/:team_id/project-preferences",
      params: { teamId: teamId },
    },
  ] as const;
export type GetTeamProjectPreferencesQueryKey = ReturnType<
  typeof getTeamProjectPreferencesQueryKey
>;
export function getTeamProjectPreferencesQueryOptions(
  teamId: GetTeamProjectPreferencesPathParams["team_id"],
  options: GetTeamProjectPreferences["client"]["parameters"] = {},
) {
  const queryKey = getTeamProjectPreferencesQueryKey(teamId);
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<
        GetTeamProjectPreferences["data"],
        GetTeamProjectPreferences["error"]
      >({
        method: "get",
        url: `/api/teams/${teamId}/project-preferences`,
        ...options,
      });
      return res;
    },
  });
}
/**
 * @link /api/teams/:team_id/project-preferences
 */
export function useGetTeamProjectPreferences<
  TData = GetTeamProjectPreferences["response"],
  TQueryData = GetTeamProjectPreferences["response"],
  TQueryKey extends QueryKey = GetTeamProjectPreferencesQueryKey,
>(
  teamId: GetTeamProjectPreferencesPathParams["team_id"],
  options: {
    query?: Partial<
      QueryObserverOptions<
        GetTeamProjectPreferences["response"],
        GetTeamProjectPreferences["error"],
        TData,
        TQueryData,
        TQueryKey
      >
    >;
    client?: GetTeamProjectPreferences["client"]["parameters"];
  } = {},
): UseQueryResult<TData, GetTeamProjectPreferences["error"]> & {
  queryKey: TQueryKey;
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {};
  const queryKey =
    queryOptions?.queryKey ?? getTeamProjectPreferencesQueryKey(teamId);
  const query = useQuery({
    ...(getTeamProjectPreferencesQueryOptions(
      teamId,
      clientOptions,
    ) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, "queryKey">),
  }) as UseQueryResult<TData, GetTeamProjectPreferences["error"]> & {
    queryKey: TQueryKey;
  };
  query.queryKey = queryKey as TQueryKey;
  return query;
}
export const getTeamProjectPreferencesSuspenseQueryKey = (
  teamId: GetTeamProjectPreferencesPathParams["team_id"],
) =>
  [
    {
      url: "/api/teams/:team_id/project-preferences",
      params: { teamId: teamId },
    },
  ] as const;
export type GetTeamProjectPreferencesSuspenseQueryKey = ReturnType<
  typeof getTeamProjectPreferencesSuspenseQueryKey
>;
export function getTeamProjectPreferencesSuspenseQueryOptions(
  teamId: GetTeamProjectPreferencesPathParams["team_id"],
  options: GetTeamProjectPreferences["client"]["parameters"] = {},
) {
  const queryKey = getTeamProjectPreferencesSuspenseQueryKey(teamId);
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<
        GetTeamProjectPreferences["data"],
        GetTeamProjectPreferences["error"]
      >({
        method: "get",
        url: `/api/teams/${teamId}/project-preferences`,
        ...options,
      });
      return res;
    },
  });
}
/**
 * @link /api/teams/:team_id/project-preferences
 */
export function useGetTeamProjectPreferencesSuspense<
  TData = GetTeamProjectPreferences["response"],
  TQueryKey extends QueryKey = GetTeamProjectPreferencesSuspenseQueryKey,
>(
  teamId: GetTeamProjectPreferencesPathParams["team_id"],
  options: {
    query?: Partial<
      UseSuspenseQueryOptions<
        GetTeamProjectPreferences["response"],
        GetTeamProjectPreferences["error"],
        TData,
        TQueryKey
      >
    >;
    client?: GetTeamProjectPreferences["client"]["parameters"];
  } = {},
): UseSuspenseQueryResult<TData, GetTeamProjectPreferences["error"]> & {
  queryKey: TQueryKey;
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {};
  const queryKey =
    queryOptions?.queryKey ?? getTeamProjectPreferencesSuspenseQueryKey(teamId);
  const query = useSuspenseQuery({
    ...(getTeamProjectPreferencesSuspenseQueryOptions(
      teamId,
      clientOptions,
    ) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, "queryKey">),
  }) as UseSuspenseQueryResult<TData, GetTeamProjectPreferences["error"]> & {
    queryKey: TQueryKey;
  };
  query.queryKey = queryKey as TQueryKey;
  return query;
}
