import type {
  GetTeamBySlug500,
  GetTeamBySlugPathParams,
  GetTeamBySlugQueryResponse,
} from "../types/GetTeamBySlug";

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

type GetTeamBySlugClient = typeof client<
  GetTeamBySlugQueryResponse,
  GetTeamBySlug500,
  never
>;
type GetTeamBySlug = {
  data: GetTeamBySlugQueryResponse;
  error: GetTeamBySlug500;
  request: never;
  pathParams: GetTeamBySlugPathParams;
  queryParams: never;
  headerParams: never;
  response: GetTeamBySlugQueryResponse;
  client: {
    parameters: Partial<Parameters<GetTeamBySlugClient>[0]>;
    return: Awaited<ReturnType<GetTeamBySlugClient>>;
  };
};
export const getTeamBySlugQueryKey = (
  eventSlug: GetTeamBySlugPathParams["event_slug"],
  teamSlug: GetTeamBySlugPathParams["team_slug"],
) =>
  [
    {
      url: "/api/teams/:event_slug/:team_slug",
      params: { eventSlug: eventSlug, teamSlug: teamSlug },
    },
  ] as const;
export type GetTeamBySlugQueryKey = ReturnType<typeof getTeamBySlugQueryKey>;
export function getTeamBySlugQueryOptions(
  eventSlug: GetTeamBySlugPathParams["event_slug"],
  teamSlug: GetTeamBySlugPathParams["team_slug"],
  options: GetTeamBySlug["client"]["parameters"] = {},
) {
  const queryKey = getTeamBySlugQueryKey(eventSlug, teamSlug);
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<GetTeamBySlug["data"], GetTeamBySlug["error"]>({
        method: "get",
        url: `/api/teams/${eventSlug}/${teamSlug}`,
        ...options,
      });
      return res;
    },
  });
}
/**
 * @link /api/teams/:event_slug/:team_slug
 */
export function useGetTeamBySlug<
  TData = GetTeamBySlug["response"],
  TQueryData = GetTeamBySlug["response"],
  TQueryKey extends QueryKey = GetTeamBySlugQueryKey,
>(
  eventSlug: GetTeamBySlugPathParams["event_slug"],
  teamSlug: GetTeamBySlugPathParams["team_slug"],
  options: {
    query?: Partial<
      QueryObserverOptions<
        GetTeamBySlug["response"],
        GetTeamBySlug["error"],
        TData,
        TQueryData,
        TQueryKey
      >
    >;
    client?: GetTeamBySlug["client"]["parameters"];
  } = {},
): UseQueryResult<TData, GetTeamBySlug["error"]> & {
  queryKey: TQueryKey;
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {};
  const queryKey =
    queryOptions?.queryKey ?? getTeamBySlugQueryKey(eventSlug, teamSlug);
  const query = useQuery({
    ...(getTeamBySlugQueryOptions(
      eventSlug,
      teamSlug,
      clientOptions,
    ) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, "queryKey">),
  }) as UseQueryResult<TData, GetTeamBySlug["error"]> & {
    queryKey: TQueryKey;
  };
  query.queryKey = queryKey as TQueryKey;
  return query;
}
export const getTeamBySlugSuspenseQueryKey = (
  eventSlug: GetTeamBySlugPathParams["event_slug"],
  teamSlug: GetTeamBySlugPathParams["team_slug"],
) =>
  [
    {
      url: "/api/teams/:event_slug/:team_slug",
      params: { eventSlug: eventSlug, teamSlug: teamSlug },
    },
  ] as const;
export type GetTeamBySlugSuspenseQueryKey = ReturnType<
  typeof getTeamBySlugSuspenseQueryKey
>;
export function getTeamBySlugSuspenseQueryOptions(
  eventSlug: GetTeamBySlugPathParams["event_slug"],
  teamSlug: GetTeamBySlugPathParams["team_slug"],
  options: GetTeamBySlug["client"]["parameters"] = {},
) {
  const queryKey = getTeamBySlugSuspenseQueryKey(eventSlug, teamSlug);
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<GetTeamBySlug["data"], GetTeamBySlug["error"]>({
        method: "get",
        url: `/api/teams/${eventSlug}/${teamSlug}`,
        ...options,
      });
      return res;
    },
  });
}
/**
 * @link /api/teams/:event_slug/:team_slug
 */
export function useGetTeamBySlugSuspense<
  TData = GetTeamBySlug["response"],
  TQueryKey extends QueryKey = GetTeamBySlugSuspenseQueryKey,
>(
  eventSlug: GetTeamBySlugPathParams["event_slug"],
  teamSlug: GetTeamBySlugPathParams["team_slug"],
  options: {
    query?: Partial<
      UseSuspenseQueryOptions<
        GetTeamBySlug["response"],
        GetTeamBySlug["error"],
        TData,
        TQueryKey
      >
    >;
    client?: GetTeamBySlug["client"]["parameters"];
  } = {},
): UseSuspenseQueryResult<TData, GetTeamBySlug["error"]> & {
  queryKey: TQueryKey;
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {};
  const queryKey =
    queryOptions?.queryKey ??
    getTeamBySlugSuspenseQueryKey(eventSlug, teamSlug);
  const query = useSuspenseQuery({
    ...(getTeamBySlugSuspenseQueryOptions(
      eventSlug,
      teamSlug,
      clientOptions,
    ) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, "queryKey">),
  }) as UseSuspenseQueryResult<TData, GetTeamBySlug["error"]> & {
    queryKey: TQueryKey;
  };
  query.queryKey = queryKey as TQueryKey;
  return query;
}
