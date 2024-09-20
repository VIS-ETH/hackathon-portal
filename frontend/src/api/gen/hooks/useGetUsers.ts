import type { GetUsersQueryResponse } from "../types/GetUsers";

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

type GetUsersClient = typeof client<GetUsersQueryResponse, never, never>;
type GetUsers = {
  data: GetUsersQueryResponse;
  error: never;
  request: never;
  pathParams: never;
  queryParams: never;
  headerParams: never;
  response: GetUsersQueryResponse;
  client: {
    parameters: Partial<Parameters<GetUsersClient>[0]>;
    return: Awaited<ReturnType<GetUsersClient>>;
  };
};
export const getUsersQueryKey = () => [{ url: "/users" }] as const;
export type GetUsersQueryKey = ReturnType<typeof getUsersQueryKey>;
export function getUsersQueryOptions(
  options: GetUsers["client"]["parameters"] = {},
) {
  const queryKey = getUsersQueryKey();
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<GetUsers["data"], GetUsers["error"]>({
        method: "get",
        url: `/users`,
        ...options,
      });
      return res.data;
    },
  });
}
/**
 * @description Optional extended description in Markdown.
 * @summary Returns a list of users.
 * @link /users
 */
export function useGetUsers<
  TData = GetUsers["response"],
  TQueryData = GetUsers["response"],
  TQueryKey extends QueryKey = GetUsersQueryKey,
>(
  options: {
    query?: Partial<
      QueryObserverOptions<
        GetUsers["response"],
        GetUsers["error"],
        TData,
        TQueryData,
        TQueryKey
      >
    >;
    client?: GetUsers["client"]["parameters"];
  } = {},
): UseQueryResult<TData, GetUsers["error"]> & {
  queryKey: TQueryKey;
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getUsersQueryKey();
  const query = useQuery({
    ...(getUsersQueryOptions(clientOptions) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, "queryKey">),
  }) as UseQueryResult<TData, GetUsers["error"]> & {
    queryKey: TQueryKey;
  };
  query.queryKey = queryKey as TQueryKey;
  return query;
}
export const getUsersSuspenseQueryKey = () => [{ url: "/users" }] as const;
export type GetUsersSuspenseQueryKey = ReturnType<
  typeof getUsersSuspenseQueryKey
>;
export function getUsersSuspenseQueryOptions(
  options: GetUsers["client"]["parameters"] = {},
) {
  const queryKey = getUsersSuspenseQueryKey();
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<GetUsers["data"], GetUsers["error"]>({
        method: "get",
        url: `/users`,
        ...options,
      });
      return res.data;
    },
  });
}
/**
 * @description Optional extended description in Markdown.
 * @summary Returns a list of users.
 * @link /users
 */
export function useGetUsersSuspense<
  TData = GetUsers["response"],
  TQueryKey extends QueryKey = GetUsersSuspenseQueryKey,
>(
  options: {
    query?: Partial<
      UseSuspenseQueryOptions<
        GetUsers["response"],
        GetUsers["error"],
        TData,
        TQueryKey
      >
    >;
    client?: GetUsers["client"]["parameters"];
  } = {},
): UseSuspenseQueryResult<TData, GetUsers["error"]> & {
  queryKey: TQueryKey;
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getUsersSuspenseQueryKey();
  const query = useSuspenseQuery({
    ...(getUsersSuspenseQueryOptions(
      clientOptions,
    ) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, "queryKey">),
  }) as UseSuspenseQueryResult<TData, GetUsers["error"]> & {
    queryKey: TQueryKey;
  };
  query.queryKey = queryKey as TQueryKey;
  return query;
}
