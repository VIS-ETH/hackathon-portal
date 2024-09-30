import type {
  GetProjects500,
  GetProjectsQueryParams,
  GetProjectsQueryResponse,
} from "../types/GetProjects";

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

type GetProjectsClient = typeof client<
  GetProjectsQueryResponse,
  GetProjects500,
  never
>;
type GetProjects = {
  data: GetProjectsQueryResponse;
  error: GetProjects500;
  request: never;
  pathParams: never;
  queryParams: GetProjectsQueryParams;
  headerParams: never;
  response: GetProjectsQueryResponse;
  client: {
    parameters: Partial<Parameters<GetProjectsClient>[0]>;
    return: Awaited<ReturnType<GetProjectsClient>>;
  };
};
export const getProjectsQueryKey = (params: GetProjects["queryParams"]) =>
  [{ url: "/api/projects" }, ...(params ? [params] : [])] as const;
export type GetProjectsQueryKey = ReturnType<typeof getProjectsQueryKey>;
export function getProjectsQueryOptions(
  params: GetProjects["queryParams"],
  options: GetProjects["client"]["parameters"] = {},
) {
  const queryKey = getProjectsQueryKey(params);
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<GetProjects["data"], GetProjects["error"]>({
        method: "get",
        url: `/api/projects`,
        params,
        ...options,
      });
      return res;
    },
  });
}
/**
 * @link /api/projects
 */
export function useGetProjects<
  TData = GetProjects["response"],
  TQueryData = GetProjects["response"],
  TQueryKey extends QueryKey = GetProjectsQueryKey,
>(
  params: GetProjects["queryParams"],
  options: {
    query?: Partial<
      QueryObserverOptions<
        GetProjects["response"],
        GetProjects["error"],
        TData,
        TQueryData,
        TQueryKey
      >
    >;
    client?: GetProjects["client"]["parameters"];
  } = {},
): UseQueryResult<TData, GetProjects["error"]> & {
  queryKey: TQueryKey;
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getProjectsQueryKey(params);
  const query = useQuery({
    ...(getProjectsQueryOptions(
      params,
      clientOptions,
    ) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, "queryKey">),
  }) as UseQueryResult<TData, GetProjects["error"]> & {
    queryKey: TQueryKey;
  };
  query.queryKey = queryKey as TQueryKey;
  return query;
}
export const getProjectsSuspenseQueryKey = (
  params: GetProjects["queryParams"],
) => [{ url: "/api/projects" }, ...(params ? [params] : [])] as const;
export type GetProjectsSuspenseQueryKey = ReturnType<
  typeof getProjectsSuspenseQueryKey
>;
export function getProjectsSuspenseQueryOptions(
  params: GetProjects["queryParams"],
  options: GetProjects["client"]["parameters"] = {},
) {
  const queryKey = getProjectsSuspenseQueryKey(params);
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<GetProjects["data"], GetProjects["error"]>({
        method: "get",
        url: `/api/projects`,
        params,
        ...options,
      });
      return res;
    },
  });
}
/**
 * @link /api/projects
 */
export function useGetProjectsSuspense<
  TData = GetProjects["response"],
  TQueryKey extends QueryKey = GetProjectsSuspenseQueryKey,
>(
  params: GetProjects["queryParams"],
  options: {
    query?: Partial<
      UseSuspenseQueryOptions<
        GetProjects["response"],
        GetProjects["error"],
        TData,
        TQueryKey
      >
    >;
    client?: GetProjects["client"]["parameters"];
  } = {},
): UseSuspenseQueryResult<TData, GetProjects["error"]> & {
  queryKey: TQueryKey;
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {};
  const queryKey =
    queryOptions?.queryKey ?? getProjectsSuspenseQueryKey(params);
  const query = useSuspenseQuery({
    ...(getProjectsSuspenseQueryOptions(
      params,
      clientOptions,
    ) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, "queryKey">),
  }) as UseSuspenseQueryResult<TData, GetProjects["error"]> & {
    queryKey: TQueryKey;
  };
  query.queryKey = queryKey as TQueryKey;
  return query;
}
