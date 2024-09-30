import type {
  GetAppointments500,
  GetAppointmentsQueryParams,
  GetAppointmentsQueryResponse,
} from "../types/GetAppointments";

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

type GetAppointmentsClient = typeof client<
  GetAppointmentsQueryResponse,
  GetAppointments500,
  never
>;
type GetAppointments = {
  data: GetAppointmentsQueryResponse;
  error: GetAppointments500;
  request: never;
  pathParams: never;
  queryParams: GetAppointmentsQueryParams;
  headerParams: never;
  response: GetAppointmentsQueryResponse;
  client: {
    parameters: Partial<Parameters<GetAppointmentsClient>[0]>;
    return: Awaited<ReturnType<GetAppointmentsClient>>;
  };
};
export const getAppointmentsQueryKey = (
  params: GetAppointments["queryParams"],
) => [{ url: "/api/appointments" }, ...(params ? [params] : [])] as const;
export type GetAppointmentsQueryKey = ReturnType<
  typeof getAppointmentsQueryKey
>;
export function getAppointmentsQueryOptions(
  params: GetAppointments["queryParams"],
  options: GetAppointments["client"]["parameters"] = {},
) {
  const queryKey = getAppointmentsQueryKey(params);
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<
        GetAppointments["data"],
        GetAppointments["error"]
      >({
        method: "get",
        url: `/api/appointments`,
        params,
        ...options,
      });
      return res;
    },
  });
}
/**
 * @link /api/appointments
 */
export function useGetAppointments<
  TData = GetAppointments["response"],
  TQueryData = GetAppointments["response"],
  TQueryKey extends QueryKey = GetAppointmentsQueryKey,
>(
  params: GetAppointments["queryParams"],
  options: {
    query?: Partial<
      QueryObserverOptions<
        GetAppointments["response"],
        GetAppointments["error"],
        TData,
        TQueryData,
        TQueryKey
      >
    >;
    client?: GetAppointments["client"]["parameters"];
  } = {},
): UseQueryResult<TData, GetAppointments["error"]> & {
  queryKey: TQueryKey;
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getAppointmentsQueryKey(params);
  const query = useQuery({
    ...(getAppointmentsQueryOptions(
      params,
      clientOptions,
    ) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, "queryKey">),
  }) as UseQueryResult<TData, GetAppointments["error"]> & {
    queryKey: TQueryKey;
  };
  query.queryKey = queryKey as TQueryKey;
  return query;
}
export const getAppointmentsSuspenseQueryKey = (
  params: GetAppointments["queryParams"],
) => [{ url: "/api/appointments" }, ...(params ? [params] : [])] as const;
export type GetAppointmentsSuspenseQueryKey = ReturnType<
  typeof getAppointmentsSuspenseQueryKey
>;
export function getAppointmentsSuspenseQueryOptions(
  params: GetAppointments["queryParams"],
  options: GetAppointments["client"]["parameters"] = {},
) {
  const queryKey = getAppointmentsSuspenseQueryKey(params);
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<
        GetAppointments["data"],
        GetAppointments["error"]
      >({
        method: "get",
        url: `/api/appointments`,
        params,
        ...options,
      });
      return res;
    },
  });
}
/**
 * @link /api/appointments
 */
export function useGetAppointmentsSuspense<
  TData = GetAppointments["response"],
  TQueryKey extends QueryKey = GetAppointmentsSuspenseQueryKey,
>(
  params: GetAppointments["queryParams"],
  options: {
    query?: Partial<
      UseSuspenseQueryOptions<
        GetAppointments["response"],
        GetAppointments["error"],
        TData,
        TQueryKey
      >
    >;
    client?: GetAppointments["client"]["parameters"];
  } = {},
): UseSuspenseQueryResult<TData, GetAppointments["error"]> & {
  queryKey: TQueryKey;
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {};
  const queryKey =
    queryOptions?.queryKey ?? getAppointmentsSuspenseQueryKey(params);
  const query = useSuspenseQuery({
    ...(getAppointmentsSuspenseQueryOptions(
      params,
      clientOptions,
    ) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, "queryKey">),
  }) as UseSuspenseQueryResult<TData, GetAppointments["error"]> & {
    queryKey: TQueryKey;
  };
  query.queryKey = queryKey as TQueryKey;
  return query;
}
