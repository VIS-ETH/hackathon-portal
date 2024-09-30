import type {
  GetProjectBySlug500,
  GetProjectBySlugPathParams,
  GetProjectBySlugQueryResponse,
} from "../types/GetProjectBySlug";

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

type GetProjectBySlugClient = typeof client<
  GetProjectBySlugQueryResponse,
  GetProjectBySlug500,
  never
>;
type GetProjectBySlug = {
  data: GetProjectBySlugQueryResponse;
  error: GetProjectBySlug500;
  request: never;
  pathParams: GetProjectBySlugPathParams;
  queryParams: never;
  headerParams: never;
  response: GetProjectBySlugQueryResponse;
  client: {
    parameters: Partial<Parameters<GetProjectBySlugClient>[0]>;
    return: Awaited<ReturnType<GetProjectBySlugClient>>;
  };
};
export const getProjectBySlugQueryKey = (
  eventSlug: GetProjectBySlugPathParams["event_slug"],
  projectSlug: GetProjectBySlugPathParams["project_slug"],
) =>
  [
    {
      url: "/api/projects/:event_slug/:project_slug",
      params: { eventSlug: eventSlug, projectSlug: projectSlug },
    },
  ] as const;
export type GetProjectBySlugQueryKey = ReturnType<
  typeof getProjectBySlugQueryKey
>;
export function getProjectBySlugQueryOptions(
  eventSlug: GetProjectBySlugPathParams["event_slug"],
  projectSlug: GetProjectBySlugPathParams["project_slug"],
  options: GetProjectBySlug["client"]["parameters"] = {},
) {
  const queryKey = getProjectBySlugQueryKey(eventSlug, projectSlug);
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<
        GetProjectBySlug["data"],
        GetProjectBySlug["error"]
      >({
        method: "get",
        url: `/api/projects/${eventSlug}/${projectSlug}`,
        ...options,
      });
      return res;
    },
  });
}
/**
 * @link /api/projects/:event_slug/:project_slug
 */
export function useGetProjectBySlug<
  TData = GetProjectBySlug["response"],
  TQueryData = GetProjectBySlug["response"],
  TQueryKey extends QueryKey = GetProjectBySlugQueryKey,
>(
  eventSlug: GetProjectBySlugPathParams["event_slug"],
  projectSlug: GetProjectBySlugPathParams["project_slug"],
  options: {
    query?: Partial<
      QueryObserverOptions<
        GetProjectBySlug["response"],
        GetProjectBySlug["error"],
        TData,
        TQueryData,
        TQueryKey
      >
    >;
    client?: GetProjectBySlug["client"]["parameters"];
  } = {},
): UseQueryResult<TData, GetProjectBySlug["error"]> & {
  queryKey: TQueryKey;
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {};
  const queryKey =
    queryOptions?.queryKey ?? getProjectBySlugQueryKey(eventSlug, projectSlug);
  const query = useQuery({
    ...(getProjectBySlugQueryOptions(
      eventSlug,
      projectSlug,
      clientOptions,
    ) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, "queryKey">),
  }) as UseQueryResult<TData, GetProjectBySlug["error"]> & {
    queryKey: TQueryKey;
  };
  query.queryKey = queryKey as TQueryKey;
  return query;
}
export const getProjectBySlugSuspenseQueryKey = (
  eventSlug: GetProjectBySlugPathParams["event_slug"],
  projectSlug: GetProjectBySlugPathParams["project_slug"],
) =>
  [
    {
      url: "/api/projects/:event_slug/:project_slug",
      params: { eventSlug: eventSlug, projectSlug: projectSlug },
    },
  ] as const;
export type GetProjectBySlugSuspenseQueryKey = ReturnType<
  typeof getProjectBySlugSuspenseQueryKey
>;
export function getProjectBySlugSuspenseQueryOptions(
  eventSlug: GetProjectBySlugPathParams["event_slug"],
  projectSlug: GetProjectBySlugPathParams["project_slug"],
  options: GetProjectBySlug["client"]["parameters"] = {},
) {
  const queryKey = getProjectBySlugSuspenseQueryKey(eventSlug, projectSlug);
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<
        GetProjectBySlug["data"],
        GetProjectBySlug["error"]
      >({
        method: "get",
        url: `/api/projects/${eventSlug}/${projectSlug}`,
        ...options,
      });
      return res;
    },
  });
}
/**
 * @link /api/projects/:event_slug/:project_slug
 */
export function useGetProjectBySlugSuspense<
  TData = GetProjectBySlug["response"],
  TQueryKey extends QueryKey = GetProjectBySlugSuspenseQueryKey,
>(
  eventSlug: GetProjectBySlugPathParams["event_slug"],
  projectSlug: GetProjectBySlugPathParams["project_slug"],
  options: {
    query?: Partial<
      UseSuspenseQueryOptions<
        GetProjectBySlug["response"],
        GetProjectBySlug["error"],
        TData,
        TQueryKey
      >
    >;
    client?: GetProjectBySlug["client"]["parameters"];
  } = {},
): UseSuspenseQueryResult<TData, GetProjectBySlug["error"]> & {
  queryKey: TQueryKey;
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {};
  const queryKey =
    queryOptions?.queryKey ??
    getProjectBySlugSuspenseQueryKey(eventSlug, projectSlug);
  const query = useSuspenseQuery({
    ...(getProjectBySlugSuspenseQueryOptions(
      eventSlug,
      projectSlug,
      clientOptions,
    ) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, "queryKey">),
  }) as UseSuspenseQueryResult<TData, GetProjectBySlug["error"]> & {
    queryKey: TQueryKey;
  };
  query.queryKey = queryKey as TQueryKey;
  return query;
}
