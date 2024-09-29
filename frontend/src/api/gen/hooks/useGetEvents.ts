import type { GetEvents500, GetEventsQueryResponse } from "../types/GetEvents";

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

type GetEventsClient = typeof client<
  GetEventsQueryResponse,
  GetEvents500,
  never
>;
type GetEvents = {
  data: GetEventsQueryResponse;
  error: GetEvents500;
  request: never;
  pathParams: never;
  queryParams: never;
  headerParams: never;
  response: GetEventsQueryResponse;
  client: {
    parameters: Partial<Parameters<GetEventsClient>[0]>;
    return: Awaited<ReturnType<GetEventsClient>>;
  };
};
export const getEventsQueryKey = () => [{ url: "/api/events" }] as const;
export type GetEventsQueryKey = ReturnType<typeof getEventsQueryKey>;
export function getEventsQueryOptions(
  options: GetEvents["client"]["parameters"] = {},
) {
  const queryKey = getEventsQueryKey();
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<GetEvents["data"], GetEvents["error"]>({
        method: "get",
        url: `/api/events`,
        ...options,
      });
      return res;
    },
  });
}
/**
 * @link /api/events
 */
export function useGetEvents<
  TData = GetEvents["response"],
  TQueryData = GetEvents["response"],
  TQueryKey extends QueryKey = GetEventsQueryKey,
>(
  options: {
    query?: Partial<
      QueryObserverOptions<
        GetEvents["response"],
        GetEvents["error"],
        TData,
        TQueryData,
        TQueryKey
      >
    >;
    client?: GetEvents["client"]["parameters"];
  } = {},
): UseQueryResult<TData, GetEvents["error"]> & {
  queryKey: TQueryKey;
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getEventsQueryKey();
  const query = useQuery({
    ...(getEventsQueryOptions(
      clientOptions,
    ) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, "queryKey">),
  }) as UseQueryResult<TData, GetEvents["error"]> & {
    queryKey: TQueryKey;
  };
  query.queryKey = queryKey as TQueryKey;
  return query;
}
export const getEventsSuspenseQueryKey = () =>
  [{ url: "/api/events" }] as const;
export type GetEventsSuspenseQueryKey = ReturnType<
  typeof getEventsSuspenseQueryKey
>;
export function getEventsSuspenseQueryOptions(
  options: GetEvents["client"]["parameters"] = {},
) {
  const queryKey = getEventsSuspenseQueryKey();
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<GetEvents["data"], GetEvents["error"]>({
        method: "get",
        url: `/api/events`,
        ...options,
      });
      return res;
    },
  });
}
/**
 * @link /api/events
 */
export function useGetEventsSuspense<
  TData = GetEvents["response"],
  TQueryKey extends QueryKey = GetEventsSuspenseQueryKey,
>(
  options: {
    query?: Partial<
      UseSuspenseQueryOptions<
        GetEvents["response"],
        GetEvents["error"],
        TData,
        TQueryKey
      >
    >;
    client?: GetEvents["client"]["parameters"];
  } = {},
): UseSuspenseQueryResult<TData, GetEvents["error"]> & {
  queryKey: TQueryKey;
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getEventsSuspenseQueryKey();
  const query = useSuspenseQuery({
    ...(getEventsSuspenseQueryOptions(
      clientOptions,
    ) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, "queryKey">),
  }) as UseSuspenseQueryResult<TData, GetEvents["error"]> & {
    queryKey: TQueryKey;
  };
  query.queryKey = queryKey as TQueryKey;
  return query;
}
