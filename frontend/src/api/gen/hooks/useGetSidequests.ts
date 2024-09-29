import type {
  GetSidequests500,
  GetSidequestsQueryParams,
  GetSidequestsQueryResponse,
} from "../types/GetSidequests";

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

type GetSidequestsClient = typeof client<
  GetSidequestsQueryResponse,
  GetSidequests500,
  never
>;
type GetSidequests = {
  data: GetSidequestsQueryResponse;
  error: GetSidequests500;
  request: never;
  pathParams: never;
  queryParams: GetSidequestsQueryParams;
  headerParams: never;
  response: GetSidequestsQueryResponse;
  client: {
    parameters: Partial<Parameters<GetSidequestsClient>[0]>;
    return: Awaited<ReturnType<GetSidequestsClient>>;
  };
};
export const getSidequestsQueryKey = (params: GetSidequests["queryParams"]) =>
  [{ url: "/api/sidequests" }, ...(params ? [params] : [])] as const;
export type GetSidequestsQueryKey = ReturnType<typeof getSidequestsQueryKey>;
export function getSidequestsQueryOptions(
  params: GetSidequests["queryParams"],
  options: GetSidequests["client"]["parameters"] = {},
) {
  const queryKey = getSidequestsQueryKey(params);
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<GetSidequests["data"], GetSidequests["error"]>({
        method: "get",
        url: `/api/sidequests`,
        params,
        ...options,
      });
      return res;
    },
  });
}
/**
 * @link /api/sidequests
 */
export function useGetSidequests<
  TData = GetSidequests["response"],
  TQueryData = GetSidequests["response"],
  TQueryKey extends QueryKey = GetSidequestsQueryKey,
>(
  params: GetSidequests["queryParams"],
  options: {
    query?: Partial<
      QueryObserverOptions<
        GetSidequests["response"],
        GetSidequests["error"],
        TData,
        TQueryData,
        TQueryKey
      >
    >;
    client?: GetSidequests["client"]["parameters"];
  } = {},
): UseQueryResult<TData, GetSidequests["error"]> & {
  queryKey: TQueryKey;
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getSidequestsQueryKey(params);
  const query = useQuery({
    ...(getSidequestsQueryOptions(
      params,
      clientOptions,
    ) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, "queryKey">),
  }) as UseQueryResult<TData, GetSidequests["error"]> & {
    queryKey: TQueryKey;
  };
  query.queryKey = queryKey as TQueryKey;
  return query;
}
export const getSidequestsSuspenseQueryKey = (
  params: GetSidequests["queryParams"],
) => [{ url: "/api/sidequests" }, ...(params ? [params] : [])] as const;
export type GetSidequestsSuspenseQueryKey = ReturnType<
  typeof getSidequestsSuspenseQueryKey
>;
export function getSidequestsSuspenseQueryOptions(
  params: GetSidequests["queryParams"],
  options: GetSidequests["client"]["parameters"] = {},
) {
  const queryKey = getSidequestsSuspenseQueryKey(params);
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<GetSidequests["data"], GetSidequests["error"]>({
        method: "get",
        url: `/api/sidequests`,
        params,
        ...options,
      });
      return res;
    },
  });
}
/**
 * @link /api/sidequests
 */
export function useGetSidequestsSuspense<
  TData = GetSidequests["response"],
  TQueryKey extends QueryKey = GetSidequestsSuspenseQueryKey,
>(
  params: GetSidequests["queryParams"],
  options: {
    query?: Partial<
      UseSuspenseQueryOptions<
        GetSidequests["response"],
        GetSidequests["error"],
        TData,
        TQueryKey
      >
    >;
    client?: GetSidequests["client"]["parameters"];
  } = {},
): UseSuspenseQueryResult<TData, GetSidequests["error"]> & {
  queryKey: TQueryKey;
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {};
  const queryKey =
    queryOptions?.queryKey ?? getSidequestsSuspenseQueryKey(params);
  const query = useSuspenseQuery({
    ...(getSidequestsSuspenseQueryOptions(
      params,
      clientOptions,
    ) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, "queryKey">),
  }) as UseSuspenseQueryResult<TData, GetSidequests["error"]> & {
    queryKey: TQueryKey;
  };
  query.queryKey = queryKey as TQueryKey;
  return query;
}
