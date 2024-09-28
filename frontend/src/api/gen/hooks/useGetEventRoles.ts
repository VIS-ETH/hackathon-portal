import type {
  GetEventRoles500,
  GetEventRolesPathParams,
  GetEventRolesQueryResponse,
} from "../types/GetEventRoles";

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

type GetEventRolesClient = typeof client<
  GetEventRolesQueryResponse,
  GetEventRoles500,
  never
>;
type GetEventRoles = {
  data: GetEventRolesQueryResponse;
  error: GetEventRoles500;
  request: never;
  pathParams: GetEventRolesPathParams;
  queryParams: never;
  headerParams: never;
  response: GetEventRolesQueryResponse;
  client: {
    parameters: Partial<Parameters<GetEventRolesClient>[0]>;
    return: Awaited<ReturnType<GetEventRolesClient>>;
  };
};
export const getEventRolesQueryKey = (
  eventId: GetEventRolesPathParams["event_id"],
) =>
  [
    { url: "/api/events/:event_id/roles", params: { eventId: eventId } },
  ] as const;
export type GetEventRolesQueryKey = ReturnType<typeof getEventRolesQueryKey>;
export function getEventRolesQueryOptions(
  eventId: GetEventRolesPathParams["event_id"],
  options: GetEventRoles["client"]["parameters"] = {},
) {
  const queryKey = getEventRolesQueryKey(eventId);
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<GetEventRoles["data"], GetEventRoles["error"]>({
        method: "get",
        url: `/api/events/${eventId}/roles`,
        ...options,
      });
      return res.data;
    },
  });
}
/**
 * @link /api/events/:event_id/roles
 */
export function useGetEventRoles<
  TData = GetEventRoles["response"],
  TQueryData = GetEventRoles["response"],
  TQueryKey extends QueryKey = GetEventRolesQueryKey,
>(
  eventId: GetEventRolesPathParams["event_id"],
  options: {
    query?: Partial<
      QueryObserverOptions<
        GetEventRoles["response"],
        GetEventRoles["error"],
        TData,
        TQueryData,
        TQueryKey
      >
    >;
    client?: GetEventRoles["client"]["parameters"];
  } = {},
): UseQueryResult<TData, GetEventRoles["error"]> & {
  queryKey: TQueryKey;
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getEventRolesQueryKey(eventId);
  const query = useQuery({
    ...(getEventRolesQueryOptions(
      eventId,
      clientOptions,
    ) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, "queryKey">),
  }) as UseQueryResult<TData, GetEventRoles["error"]> & {
    queryKey: TQueryKey;
  };
  query.queryKey = queryKey as TQueryKey;
  return query;
}
export const getEventRolesSuspenseQueryKey = (
  eventId: GetEventRolesPathParams["event_id"],
) =>
  [
    { url: "/api/events/:event_id/roles", params: { eventId: eventId } },
  ] as const;
export type GetEventRolesSuspenseQueryKey = ReturnType<
  typeof getEventRolesSuspenseQueryKey
>;
export function getEventRolesSuspenseQueryOptions(
  eventId: GetEventRolesPathParams["event_id"],
  options: GetEventRoles["client"]["parameters"] = {},
) {
  const queryKey = getEventRolesSuspenseQueryKey(eventId);
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<GetEventRoles["data"], GetEventRoles["error"]>({
        method: "get",
        url: `/api/events/${eventId}/roles`,
        ...options,
      });
      return res.data;
    },
  });
}
/**
 * @link /api/events/:event_id/roles
 */
export function useGetEventRolesSuspense<
  TData = GetEventRoles["response"],
  TQueryKey extends QueryKey = GetEventRolesSuspenseQueryKey,
>(
  eventId: GetEventRolesPathParams["event_id"],
  options: {
    query?: Partial<
      UseSuspenseQueryOptions<
        GetEventRoles["response"],
        GetEventRoles["error"],
        TData,
        TQueryKey
      >
    >;
    client?: GetEventRoles["client"]["parameters"];
  } = {},
): UseSuspenseQueryResult<TData, GetEventRoles["error"]> & {
  queryKey: TQueryKey;
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {};
  const queryKey =
    queryOptions?.queryKey ?? getEventRolesSuspenseQueryKey(eventId);
  const query = useSuspenseQuery({
    ...(getEventRolesSuspenseQueryOptions(
      eventId,
      clientOptions,
    ) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, "queryKey">),
  }) as UseSuspenseQueryResult<TData, GetEventRoles["error"]> & {
    queryKey: TQueryKey;
  };
  query.queryKey = queryKey as TQueryKey;
  return query;
}
