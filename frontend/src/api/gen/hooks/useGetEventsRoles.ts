import type {
  GetEventsRoles500,
  GetEventsRolesQueryResponse,
} from "../types/GetEventsRoles";

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

type GetEventsRolesClient = typeof client<
  GetEventsRolesQueryResponse,
  GetEventsRoles500,
  never
>;
type GetEventsRoles = {
  data: GetEventsRolesQueryResponse;
  error: GetEventsRoles500;
  request: never;
  pathParams: never;
  queryParams: never;
  headerParams: never;
  response: GetEventsRolesQueryResponse;
  client: {
    parameters: Partial<Parameters<GetEventsRolesClient>[0]>;
    return: Awaited<ReturnType<GetEventsRolesClient>>;
  };
};
export const getEventsRolesQueryKey = () =>
  [{ url: "/api/events/roles" }] as const;
export type GetEventsRolesQueryKey = ReturnType<typeof getEventsRolesQueryKey>;
export function getEventsRolesQueryOptions(
  options: GetEventsRoles["client"]["parameters"] = {},
) {
  const queryKey = getEventsRolesQueryKey();
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<GetEventsRoles["data"], GetEventsRoles["error"]>(
        {
          method: "get",
          url: `/api/events/roles`,
          ...options,
        },
      );
      return res.data;
    },
  });
}
/**
 * @link /api/events/roles
 */
export function useGetEventsRoles<
  TData = GetEventsRoles["response"],
  TQueryData = GetEventsRoles["response"],
  TQueryKey extends QueryKey = GetEventsRolesQueryKey,
>(
  options: {
    query?: Partial<
      QueryObserverOptions<
        GetEventsRoles["response"],
        GetEventsRoles["error"],
        TData,
        TQueryData,
        TQueryKey
      >
    >;
    client?: GetEventsRoles["client"]["parameters"];
  } = {},
): UseQueryResult<TData, GetEventsRoles["error"]> & {
  queryKey: TQueryKey;
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getEventsRolesQueryKey();
  const query = useQuery({
    ...(getEventsRolesQueryOptions(
      clientOptions,
    ) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, "queryKey">),
  }) as UseQueryResult<TData, GetEventsRoles["error"]> & {
    queryKey: TQueryKey;
  };
  query.queryKey = queryKey as TQueryKey;
  return query;
}
export const getEventsRolesSuspenseQueryKey = () =>
  [{ url: "/api/events/roles" }] as const;
export type GetEventsRolesSuspenseQueryKey = ReturnType<
  typeof getEventsRolesSuspenseQueryKey
>;
export function getEventsRolesSuspenseQueryOptions(
  options: GetEventsRoles["client"]["parameters"] = {},
) {
  const queryKey = getEventsRolesSuspenseQueryKey();
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<GetEventsRoles["data"], GetEventsRoles["error"]>(
        {
          method: "get",
          url: `/api/events/roles`,
          ...options,
        },
      );
      return res.data;
    },
  });
}
/**
 * @link /api/events/roles
 */
export function useGetEventsRolesSuspense<
  TData = GetEventsRoles["response"],
  TQueryKey extends QueryKey = GetEventsRolesSuspenseQueryKey,
>(
  options: {
    query?: Partial<
      UseSuspenseQueryOptions<
        GetEventsRoles["response"],
        GetEventsRoles["error"],
        TData,
        TQueryKey
      >
    >;
    client?: GetEventsRoles["client"]["parameters"];
  } = {},
): UseSuspenseQueryResult<TData, GetEventsRoles["error"]> & {
  queryKey: TQueryKey;
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getEventsRolesSuspenseQueryKey();
  const query = useSuspenseQuery({
    ...(getEventsRolesSuspenseQueryOptions(
      clientOptions,
    ) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, "queryKey">),
  }) as UseSuspenseQueryResult<TData, GetEventsRoles["error"]> & {
    queryKey: TQueryKey;
  };
  query.queryKey = queryKey as TQueryKey;
  return query;
}
