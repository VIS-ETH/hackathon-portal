import type {
  GetAppointment500,
  GetAppointmentPathParams,
  GetAppointmentQueryResponse,
} from "../types/GetAppointment";

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

type GetAppointmentClient = typeof client<
  GetAppointmentQueryResponse,
  GetAppointment500,
  never
>;
type GetAppointment = {
  data: GetAppointmentQueryResponse;
  error: GetAppointment500;
  request: never;
  pathParams: GetAppointmentPathParams;
  queryParams: never;
  headerParams: never;
  response: GetAppointmentQueryResponse;
  client: {
    parameters: Partial<Parameters<GetAppointmentClient>[0]>;
    return: Awaited<ReturnType<GetAppointmentClient>>;
  };
};
export const getAppointmentQueryKey = (
  appointmentId: GetAppointmentPathParams["appointment_id"],
) =>
  [
    {
      url: "/api/appointments/:appointment_id",
      params: { appointmentId: appointmentId },
    },
  ] as const;
export type GetAppointmentQueryKey = ReturnType<typeof getAppointmentQueryKey>;
export function getAppointmentQueryOptions(
  appointmentId: GetAppointmentPathParams["appointment_id"],
  options: GetAppointment["client"]["parameters"] = {},
) {
  const queryKey = getAppointmentQueryKey(appointmentId);
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<GetAppointment["data"], GetAppointment["error"]>(
        {
          method: "get",
          url: `/api/appointments/${appointmentId}`,
          ...options,
        },
      );
      return res;
    },
  });
}
/**
 * @link /api/appointments/:appointment_id
 */
export function useGetAppointment<
  TData = GetAppointment["response"],
  TQueryData = GetAppointment["response"],
  TQueryKey extends QueryKey = GetAppointmentQueryKey,
>(
  appointmentId: GetAppointmentPathParams["appointment_id"],
  options: {
    query?: Partial<
      QueryObserverOptions<
        GetAppointment["response"],
        GetAppointment["error"],
        TData,
        TQueryData,
        TQueryKey
      >
    >;
    client?: GetAppointment["client"]["parameters"];
  } = {},
): UseQueryResult<TData, GetAppointment["error"]> & {
  queryKey: TQueryKey;
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {};
  const queryKey =
    queryOptions?.queryKey ?? getAppointmentQueryKey(appointmentId);
  const query = useQuery({
    ...(getAppointmentQueryOptions(
      appointmentId,
      clientOptions,
    ) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, "queryKey">),
  }) as UseQueryResult<TData, GetAppointment["error"]> & {
    queryKey: TQueryKey;
  };
  query.queryKey = queryKey as TQueryKey;
  return query;
}
export const getAppointmentSuspenseQueryKey = (
  appointmentId: GetAppointmentPathParams["appointment_id"],
) =>
  [
    {
      url: "/api/appointments/:appointment_id",
      params: { appointmentId: appointmentId },
    },
  ] as const;
export type GetAppointmentSuspenseQueryKey = ReturnType<
  typeof getAppointmentSuspenseQueryKey
>;
export function getAppointmentSuspenseQueryOptions(
  appointmentId: GetAppointmentPathParams["appointment_id"],
  options: GetAppointment["client"]["parameters"] = {},
) {
  const queryKey = getAppointmentSuspenseQueryKey(appointmentId);
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<GetAppointment["data"], GetAppointment["error"]>(
        {
          method: "get",
          url: `/api/appointments/${appointmentId}`,
          ...options,
        },
      );
      return res;
    },
  });
}
/**
 * @link /api/appointments/:appointment_id
 */
export function useGetAppointmentSuspense<
  TData = GetAppointment["response"],
  TQueryKey extends QueryKey = GetAppointmentSuspenseQueryKey,
>(
  appointmentId: GetAppointmentPathParams["appointment_id"],
  options: {
    query?: Partial<
      UseSuspenseQueryOptions<
        GetAppointment["response"],
        GetAppointment["error"],
        TData,
        TQueryKey
      >
    >;
    client?: GetAppointment["client"]["parameters"];
  } = {},
): UseSuspenseQueryResult<TData, GetAppointment["error"]> & {
  queryKey: TQueryKey;
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {};
  const queryKey =
    queryOptions?.queryKey ?? getAppointmentSuspenseQueryKey(appointmentId);
  const query = useSuspenseQuery({
    ...(getAppointmentSuspenseQueryOptions(
      appointmentId,
      clientOptions,
    ) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, "queryKey">),
  }) as UseSuspenseQueryResult<TData, GetAppointment["error"]> & {
    queryKey: TQueryKey;
  };
  query.queryKey = queryKey as TQueryKey;
  return query;
}
