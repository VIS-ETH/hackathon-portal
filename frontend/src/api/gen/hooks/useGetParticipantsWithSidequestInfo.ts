import type {
  GetParticipantsWithSidequestInfo500,
  GetParticipantsWithSidequestInfoQueryParams,
  GetParticipantsWithSidequestInfoQueryResponse,
} from "../types/GetParticipantsWithSidequestInfo";

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

type GetParticipantsWithSidequestInfoClient = typeof client<
  GetParticipantsWithSidequestInfoQueryResponse,
  GetParticipantsWithSidequestInfo500,
  never
>;
type GetParticipantsWithSidequestInfo = {
  data: GetParticipantsWithSidequestInfoQueryResponse;
  error: GetParticipantsWithSidequestInfo500;
  request: never;
  pathParams: never;
  queryParams: GetParticipantsWithSidequestInfoQueryParams;
  headerParams: never;
  response: GetParticipantsWithSidequestInfoQueryResponse;
  client: {
    parameters: Partial<Parameters<GetParticipantsWithSidequestInfoClient>[0]>;
    return: Awaited<ReturnType<GetParticipantsWithSidequestInfoClient>>;
  };
};
export const getParticipantsWithSidequestInfoQueryKey = (
  params: GetParticipantsWithSidequestInfo["queryParams"],
) =>
  [
    { url: "/api/sidequests/participants" },
    ...(params ? [params] : []),
  ] as const;
export type GetParticipantsWithSidequestInfoQueryKey = ReturnType<
  typeof getParticipantsWithSidequestInfoQueryKey
>;
export function getParticipantsWithSidequestInfoQueryOptions(
  params: GetParticipantsWithSidequestInfo["queryParams"],
  options: GetParticipantsWithSidequestInfo["client"]["parameters"] = {},
) {
  const queryKey = getParticipantsWithSidequestInfoQueryKey(params);
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<
        GetParticipantsWithSidequestInfo["data"],
        GetParticipantsWithSidequestInfo["error"]
      >({
        method: "get",
        url: `/api/sidequests/participants`,
        params,
        ...options,
      });
      return res;
    },
  });
}
/**
 * @link /api/sidequests/participants
 */
export function useGetParticipantsWithSidequestInfo<
  TData = GetParticipantsWithSidequestInfo["response"],
  TQueryData = GetParticipantsWithSidequestInfo["response"],
  TQueryKey extends QueryKey = GetParticipantsWithSidequestInfoQueryKey,
>(
  params: GetParticipantsWithSidequestInfo["queryParams"],
  options: {
    query?: Partial<
      QueryObserverOptions<
        GetParticipantsWithSidequestInfo["response"],
        GetParticipantsWithSidequestInfo["error"],
        TData,
        TQueryData,
        TQueryKey
      >
    >;
    client?: GetParticipantsWithSidequestInfo["client"]["parameters"];
  } = {},
): UseQueryResult<TData, GetParticipantsWithSidequestInfo["error"]> & {
  queryKey: TQueryKey;
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {};
  const queryKey =
    queryOptions?.queryKey ?? getParticipantsWithSidequestInfoQueryKey(params);
  const query = useQuery({
    ...(getParticipantsWithSidequestInfoQueryOptions(
      params,
      clientOptions,
    ) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, "queryKey">),
  }) as UseQueryResult<TData, GetParticipantsWithSidequestInfo["error"]> & {
    queryKey: TQueryKey;
  };
  query.queryKey = queryKey as TQueryKey;
  return query;
}
export const getParticipantsWithSidequestInfoSuspenseQueryKey = (
  params: GetParticipantsWithSidequestInfo["queryParams"],
) =>
  [
    { url: "/api/sidequests/participants" },
    ...(params ? [params] : []),
  ] as const;
export type GetParticipantsWithSidequestInfoSuspenseQueryKey = ReturnType<
  typeof getParticipantsWithSidequestInfoSuspenseQueryKey
>;
export function getParticipantsWithSidequestInfoSuspenseQueryOptions(
  params: GetParticipantsWithSidequestInfo["queryParams"],
  options: GetParticipantsWithSidequestInfo["client"]["parameters"] = {},
) {
  const queryKey = getParticipantsWithSidequestInfoSuspenseQueryKey(params);
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<
        GetParticipantsWithSidequestInfo["data"],
        GetParticipantsWithSidequestInfo["error"]
      >({
        method: "get",
        url: `/api/sidequests/participants`,
        params,
        ...options,
      });
      return res;
    },
  });
}
/**
 * @link /api/sidequests/participants
 */
export function useGetParticipantsWithSidequestInfoSuspense<
  TData = GetParticipantsWithSidequestInfo["response"],
  TQueryKey extends QueryKey = GetParticipantsWithSidequestInfoSuspenseQueryKey,
>(
  params: GetParticipantsWithSidequestInfo["queryParams"],
  options: {
    query?: Partial<
      UseSuspenseQueryOptions<
        GetParticipantsWithSidequestInfo["response"],
        GetParticipantsWithSidequestInfo["error"],
        TData,
        TQueryKey
      >
    >;
    client?: GetParticipantsWithSidequestInfo["client"]["parameters"];
  } = {},
): UseSuspenseQueryResult<TData, GetParticipantsWithSidequestInfo["error"]> & {
  queryKey: TQueryKey;
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {};
  const queryKey =
    queryOptions?.queryKey ??
    getParticipantsWithSidequestInfoSuspenseQueryKey(params);
  const query = useSuspenseQuery({
    ...(getParticipantsWithSidequestInfoSuspenseQueryOptions(
      params,
      clientOptions,
    ) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, "queryKey">),
  }) as UseSuspenseQueryResult<
    TData,
    GetParticipantsWithSidequestInfo["error"]
  > & {
    queryKey: TQueryKey;
  };
  query.queryKey = queryKey as TQueryKey;
  return query;
}
