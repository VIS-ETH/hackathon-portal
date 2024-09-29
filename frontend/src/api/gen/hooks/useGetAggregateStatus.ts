import type {
  GetAggregateStatus500,
  GetAggregateStatusPathParams,
  GetAggregateStatusQueryResponse,
} from "../types/GetAggregateStatus";

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

type GetAggregateStatusClient = typeof client<
  GetAggregateStatusQueryResponse,
  GetAggregateStatus500,
  never
>;
type GetAggregateStatus = {
  data: GetAggregateStatusQueryResponse;
  error: GetAggregateStatus500;
  request: never;
  pathParams: GetAggregateStatusPathParams;
  queryParams: never;
  headerParams: never;
  response: GetAggregateStatusQueryResponse;
  client: {
    parameters: Partial<Parameters<GetAggregateStatusClient>[0]>;
    return: Awaited<ReturnType<GetAggregateStatusClient>>;
  };
};
export const getAggregateStatusQueryKey = (
  eventId: GetAggregateStatusPathParams["event_id"],
) =>
  [
    { url: "/api/events/:event_id/aggregate", params: { eventId: eventId } },
  ] as const;
export type GetAggregateStatusQueryKey = ReturnType<
  typeof getAggregateStatusQueryKey
>;
export function getAggregateStatusQueryOptions(
  eventId: GetAggregateStatusPathParams["event_id"],
  options: GetAggregateStatus["client"]["parameters"] = {},
) {
  const queryKey = getAggregateStatusQueryKey(eventId);
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<
        GetAggregateStatus["data"],
        GetAggregateStatus["error"]
      >({
        method: "get",
        url: `/api/events/${eventId}/aggregate`,
        ...options,
      });
      return res;
    },
  });
}
/**
 * @link /api/events/:event_id/aggregate
 */
export function useGetAggregateStatus<
  TData = GetAggregateStatus["response"],
  TQueryData = GetAggregateStatus["response"],
  TQueryKey extends QueryKey = GetAggregateStatusQueryKey,
>(
  eventId: GetAggregateStatusPathParams["event_id"],
  options: {
    query?: Partial<
      QueryObserverOptions<
        GetAggregateStatus["response"],
        GetAggregateStatus["error"],
        TData,
        TQueryData,
        TQueryKey
      >
    >;
    client?: GetAggregateStatus["client"]["parameters"];
  } = {},
): UseQueryResult<TData, GetAggregateStatus["error"]> & {
  queryKey: TQueryKey;
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {};
  const queryKey =
    queryOptions?.queryKey ?? getAggregateStatusQueryKey(eventId);
  const query = useQuery({
    ...(getAggregateStatusQueryOptions(
      eventId,
      clientOptions,
    ) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, "queryKey">),
  }) as UseQueryResult<TData, GetAggregateStatus["error"]> & {
    queryKey: TQueryKey;
  };
  query.queryKey = queryKey as TQueryKey;
  return query;
}
export const getAggregateStatusSuspenseQueryKey = (
  eventId: GetAggregateStatusPathParams["event_id"],
) =>
  [
    { url: "/api/events/:event_id/aggregate", params: { eventId: eventId } },
  ] as const;
export type GetAggregateStatusSuspenseQueryKey = ReturnType<
  typeof getAggregateStatusSuspenseQueryKey
>;
export function getAggregateStatusSuspenseQueryOptions(
  eventId: GetAggregateStatusPathParams["event_id"],
  options: GetAggregateStatus["client"]["parameters"] = {},
) {
  const queryKey = getAggregateStatusSuspenseQueryKey(eventId);
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<
        GetAggregateStatus["data"],
        GetAggregateStatus["error"]
      >({
        method: "get",
        url: `/api/events/${eventId}/aggregate`,
        ...options,
      });
      return res;
    },
  });
}
/**
 * @link /api/events/:event_id/aggregate
 */
export function useGetAggregateStatusSuspense<
  TData = GetAggregateStatus["response"],
  TQueryKey extends QueryKey = GetAggregateStatusSuspenseQueryKey,
>(
  eventId: GetAggregateStatusPathParams["event_id"],
  options: {
    query?: Partial<
      UseSuspenseQueryOptions<
        GetAggregateStatus["response"],
        GetAggregateStatus["error"],
        TData,
        TQueryKey
      >
    >;
    client?: GetAggregateStatus["client"]["parameters"];
  } = {},
): UseSuspenseQueryResult<TData, GetAggregateStatus["error"]> & {
  queryKey: TQueryKey;
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {};
  const queryKey =
    queryOptions?.queryKey ?? getAggregateStatusSuspenseQueryKey(eventId);
  const query = useSuspenseQuery({
    ...(getAggregateStatusSuspenseQueryOptions(
      eventId,
      clientOptions,
    ) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, "queryKey">),
  }) as UseSuspenseQueryResult<TData, GetAggregateStatus["error"]> & {
    queryKey: TQueryKey;
  };
  query.queryKey = queryKey as TQueryKey;
  return query;
}
