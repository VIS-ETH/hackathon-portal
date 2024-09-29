import type {
  GetSidequest500,
  GetSidequestPathParams,
  GetSidequestQueryResponse,
} from "../types/GetSidequest";

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

type GetSidequestClient = typeof client<
  GetSidequestQueryResponse,
  GetSidequest500,
  never
>;
type GetSidequest = {
  data: GetSidequestQueryResponse;
  error: GetSidequest500;
  request: never;
  pathParams: GetSidequestPathParams;
  queryParams: never;
  headerParams: never;
  response: GetSidequestQueryResponse;
  client: {
    parameters: Partial<Parameters<GetSidequestClient>[0]>;
    return: Awaited<ReturnType<GetSidequestClient>>;
  };
};
export const getSidequestQueryKey = (
  sidequestId: GetSidequestPathParams["sidequest_id"],
) =>
  [
    {
      url: "/api/sidequests/:sidequest_id",
      params: { sidequestId: sidequestId },
    },
  ] as const;
export type GetSidequestQueryKey = ReturnType<typeof getSidequestQueryKey>;
export function getSidequestQueryOptions(
  sidequestId: GetSidequestPathParams["sidequest_id"],
  options: GetSidequest["client"]["parameters"] = {},
) {
  const queryKey = getSidequestQueryKey(sidequestId);
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<GetSidequest["data"], GetSidequest["error"]>({
        method: "get",
        url: `/api/sidequests/${sidequestId}`,
        ...options,
      });
      return res;
    },
  });
}
/**
 * @link /api/sidequests/:sidequest_id
 */
export function useGetSidequest<
  TData = GetSidequest["response"],
  TQueryData = GetSidequest["response"],
  TQueryKey extends QueryKey = GetSidequestQueryKey,
>(
  sidequestId: GetSidequestPathParams["sidequest_id"],
  options: {
    query?: Partial<
      QueryObserverOptions<
        GetSidequest["response"],
        GetSidequest["error"],
        TData,
        TQueryData,
        TQueryKey
      >
    >;
    client?: GetSidequest["client"]["parameters"];
  } = {},
): UseQueryResult<TData, GetSidequest["error"]> & {
  queryKey: TQueryKey;
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getSidequestQueryKey(sidequestId);
  const query = useQuery({
    ...(getSidequestQueryOptions(
      sidequestId,
      clientOptions,
    ) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, "queryKey">),
  }) as UseQueryResult<TData, GetSidequest["error"]> & {
    queryKey: TQueryKey;
  };
  query.queryKey = queryKey as TQueryKey;
  return query;
}
export const getSidequestSuspenseQueryKey = (
  sidequestId: GetSidequestPathParams["sidequest_id"],
) =>
  [
    {
      url: "/api/sidequests/:sidequest_id",
      params: { sidequestId: sidequestId },
    },
  ] as const;
export type GetSidequestSuspenseQueryKey = ReturnType<
  typeof getSidequestSuspenseQueryKey
>;
export function getSidequestSuspenseQueryOptions(
  sidequestId: GetSidequestPathParams["sidequest_id"],
  options: GetSidequest["client"]["parameters"] = {},
) {
  const queryKey = getSidequestSuspenseQueryKey(sidequestId);
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<GetSidequest["data"], GetSidequest["error"]>({
        method: "get",
        url: `/api/sidequests/${sidequestId}`,
        ...options,
      });
      return res;
    },
  });
}
/**
 * @link /api/sidequests/:sidequest_id
 */
export function useGetSidequestSuspense<
  TData = GetSidequest["response"],
  TQueryKey extends QueryKey = GetSidequestSuspenseQueryKey,
>(
  sidequestId: GetSidequestPathParams["sidequest_id"],
  options: {
    query?: Partial<
      UseSuspenseQueryOptions<
        GetSidequest["response"],
        GetSidequest["error"],
        TData,
        TQueryKey
      >
    >;
    client?: GetSidequest["client"]["parameters"];
  } = {},
): UseSuspenseQueryResult<TData, GetSidequest["error"]> & {
  queryKey: TQueryKey;
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {};
  const queryKey =
    queryOptions?.queryKey ?? getSidequestSuspenseQueryKey(sidequestId);
  const query = useSuspenseQuery({
    ...(getSidequestSuspenseQueryOptions(
      sidequestId,
      clientOptions,
    ) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, "queryKey">),
  }) as UseSuspenseQueryResult<TData, GetSidequest["error"]> & {
    queryKey: TQueryKey;
  };
  query.queryKey = queryKey as TQueryKey;
  return query;
}
