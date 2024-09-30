import type {
  GetTeam500,
  GetTeamPathParams,
  GetTeamQueryResponse,
} from "../types/GetTeam";

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

type GetTeamClient = typeof client<GetTeamQueryResponse, GetTeam500, never>;
type GetTeam = {
  data: GetTeamQueryResponse;
  error: GetTeam500;
  request: never;
  pathParams: GetTeamPathParams;
  queryParams: never;
  headerParams: never;
  response: GetTeamQueryResponse;
  client: {
    parameters: Partial<Parameters<GetTeamClient>[0]>;
    return: Awaited<ReturnType<GetTeamClient>>;
  };
};
export const getTeamQueryKey = (teamId: GetTeamPathParams["team_id"]) =>
  [{ url: "/api/teams/:team_id", params: { teamId: teamId } }] as const;
export type GetTeamQueryKey = ReturnType<typeof getTeamQueryKey>;
export function getTeamQueryOptions(
  teamId: GetTeamPathParams["team_id"],
  options: GetTeam["client"]["parameters"] = {},
) {
  const queryKey = getTeamQueryKey(teamId);
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<GetTeam["data"], GetTeam["error"]>({
        method: "get",
        url: `/api/teams/${teamId}`,
        ...options,
      });
      return res;
    },
  });
}
/**
 * @link /api/teams/:team_id
 */
export function useGetTeam<
  TData = GetTeam["response"],
  TQueryData = GetTeam["response"],
  TQueryKey extends QueryKey = GetTeamQueryKey,
>(
  teamId: GetTeamPathParams["team_id"],
  options: {
    query?: Partial<
      QueryObserverOptions<
        GetTeam["response"],
        GetTeam["error"],
        TData,
        TQueryData,
        TQueryKey
      >
    >;
    client?: GetTeam["client"]["parameters"];
  } = {},
): UseQueryResult<TData, GetTeam["error"]> & {
  queryKey: TQueryKey;
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getTeamQueryKey(teamId);
  const query = useQuery({
    ...(getTeamQueryOptions(
      teamId,
      clientOptions,
    ) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, "queryKey">),
  }) as UseQueryResult<TData, GetTeam["error"]> & {
    queryKey: TQueryKey;
  };
  query.queryKey = queryKey as TQueryKey;
  return query;
}
export const getTeamSuspenseQueryKey = (teamId: GetTeamPathParams["team_id"]) =>
  [{ url: "/api/teams/:team_id", params: { teamId: teamId } }] as const;
export type GetTeamSuspenseQueryKey = ReturnType<
  typeof getTeamSuspenseQueryKey
>;
export function getTeamSuspenseQueryOptions(
  teamId: GetTeamPathParams["team_id"],
  options: GetTeam["client"]["parameters"] = {},
) {
  const queryKey = getTeamSuspenseQueryKey(teamId);
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<GetTeam["data"], GetTeam["error"]>({
        method: "get",
        url: `/api/teams/${teamId}`,
        ...options,
      });
      return res;
    },
  });
}
/**
 * @link /api/teams/:team_id
 */
export function useGetTeamSuspense<
  TData = GetTeam["response"],
  TQueryKey extends QueryKey = GetTeamSuspenseQueryKey,
>(
  teamId: GetTeamPathParams["team_id"],
  options: {
    query?: Partial<
      UseSuspenseQueryOptions<
        GetTeam["response"],
        GetTeam["error"],
        TData,
        TQueryKey
      >
    >;
    client?: GetTeam["client"]["parameters"];
  } = {},
): UseSuspenseQueryResult<TData, GetTeam["error"]> & {
  queryKey: TQueryKey;
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getTeamSuspenseQueryKey(teamId);
  const query = useSuspenseQuery({
    ...(getTeamSuspenseQueryOptions(
      teamId,
      clientOptions,
    ) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, "queryKey">),
  }) as UseSuspenseQueryResult<TData, GetTeam["error"]> & {
    queryKey: TQueryKey;
  };
  query.queryKey = queryKey as TQueryKey;
  return query;
}
