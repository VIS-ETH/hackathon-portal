import type {
  GetEvent500,
  GetEventPathParams,
  GetEventQueryResponse,
} from "../types/GetEvent";

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

type GetEventClient = typeof client<GetEventQueryResponse, GetEvent500, never>;
type GetEvent = {
  data: GetEventQueryResponse;
  error: GetEvent500;
  request: never;
  pathParams: GetEventPathParams;
  queryParams: never;
  headerParams: never;
  response: GetEventQueryResponse;
  client: {
    parameters: Partial<Parameters<GetEventClient>[0]>;
    return: Awaited<ReturnType<GetEventClient>>;
  };
};
export const getEventQueryKey = (eventId: GetEventPathParams["event_id"]) =>
  [{ url: "/api/events/:event_id", params: { eventId: eventId } }] as const;
export type GetEventQueryKey = ReturnType<typeof getEventQueryKey>;
export function getEventQueryOptions(
  eventId: GetEventPathParams["event_id"],
  options: GetEvent["client"]["parameters"] = {},
) {
  const queryKey = getEventQueryKey(eventId);
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<GetEvent["data"], GetEvent["error"]>({
        method: "get",
        url: `/api/events/${eventId}`,
        ...options,
      });
      return res.data;
    },
  });
}
/**
 * @link /api/events/:event_id
 */
export function useGetEvent<
  TData = GetEvent["response"],
  TQueryData = GetEvent["response"],
  TQueryKey extends QueryKey = GetEventQueryKey,
>(
  eventId: GetEventPathParams["event_id"],
  options: {
    query?: Partial<
      QueryObserverOptions<
        GetEvent["response"],
        GetEvent["error"],
        TData,
        TQueryData,
        TQueryKey
      >
    >;
    client?: GetEvent["client"]["parameters"];
  } = {},
): UseQueryResult<TData, GetEvent["error"]> & {
  queryKey: TQueryKey;
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getEventQueryKey(eventId);
  const query = useQuery({
    ...(getEventQueryOptions(
      eventId,
      clientOptions,
    ) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, "queryKey">),
  }) as UseQueryResult<TData, GetEvent["error"]> & {
    queryKey: TQueryKey;
  };
  query.queryKey = queryKey as TQueryKey;
  return query;
}
export const getEventSuspenseQueryKey = (
  eventId: GetEventPathParams["event_id"],
) => [{ url: "/api/events/:event_id", params: { eventId: eventId } }] as const;
export type GetEventSuspenseQueryKey = ReturnType<
  typeof getEventSuspenseQueryKey
>;
export function getEventSuspenseQueryOptions(
  eventId: GetEventPathParams["event_id"],
  options: GetEvent["client"]["parameters"] = {},
) {
  const queryKey = getEventSuspenseQueryKey(eventId);
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<GetEvent["data"], GetEvent["error"]>({
        method: "get",
        url: `/api/events/${eventId}`,
        ...options,
      });
      return res.data;
    },
  });
}
/**
 * @link /api/events/:event_id
 */
export function useGetEventSuspense<
  TData = GetEvent["response"],
  TQueryKey extends QueryKey = GetEventSuspenseQueryKey,
>(
  eventId: GetEventPathParams["event_id"],
  options: {
    query?: Partial<
      UseSuspenseQueryOptions<
        GetEvent["response"],
        GetEvent["error"],
        TData,
        TQueryKey
      >
    >;
    client?: GetEvent["client"]["parameters"];
  } = {},
): UseSuspenseQueryResult<TData, GetEvent["error"]> & {
  queryKey: TQueryKey;
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getEventSuspenseQueryKey(eventId);
  const query = useSuspenseQuery({
    ...(getEventSuspenseQueryOptions(
      eventId,
      clientOptions,
    ) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, "queryKey">),
  }) as UseSuspenseQueryResult<TData, GetEvent["error"]> & {
    queryKey: TQueryKey;
  };
  query.queryKey = queryKey as TQueryKey;
  return query;
}
