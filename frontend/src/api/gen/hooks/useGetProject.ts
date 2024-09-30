import type {
  GetProject500,
  GetProjectPathParams,
  GetProjectQueryResponse,
} from "../types/GetProject";

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

type GetProjectClient = typeof client<
  GetProjectQueryResponse,
  GetProject500,
  never
>;
type GetProject = {
  data: GetProjectQueryResponse;
  error: GetProject500;
  request: never;
  pathParams: GetProjectPathParams;
  queryParams: never;
  headerParams: never;
  response: GetProjectQueryResponse;
  client: {
    parameters: Partial<Parameters<GetProjectClient>[0]>;
    return: Awaited<ReturnType<GetProjectClient>>;
  };
};
export const getProjectQueryKey = (
  projectId: GetProjectPathParams["project_id"],
) =>
  [
    { url: "/api/projects/:project_id", params: { projectId: projectId } },
  ] as const;
export type GetProjectQueryKey = ReturnType<typeof getProjectQueryKey>;
export function getProjectQueryOptions(
  projectId: GetProjectPathParams["project_id"],
  options: GetProject["client"]["parameters"] = {},
) {
  const queryKey = getProjectQueryKey(projectId);
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<GetProject["data"], GetProject["error"]>({
        method: "get",
        url: `/api/projects/${projectId}`,
        ...options,
      });
      return res;
    },
  });
}
/**
 * @link /api/projects/:project_id
 */
export function useGetProject<
  TData = GetProject["response"],
  TQueryData = GetProject["response"],
  TQueryKey extends QueryKey = GetProjectQueryKey,
>(
  projectId: GetProjectPathParams["project_id"],
  options: {
    query?: Partial<
      QueryObserverOptions<
        GetProject["response"],
        GetProject["error"],
        TData,
        TQueryData,
        TQueryKey
      >
    >;
    client?: GetProject["client"]["parameters"];
  } = {},
): UseQueryResult<TData, GetProject["error"]> & {
  queryKey: TQueryKey;
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getProjectQueryKey(projectId);
  const query = useQuery({
    ...(getProjectQueryOptions(
      projectId,
      clientOptions,
    ) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, "queryKey">),
  }) as UseQueryResult<TData, GetProject["error"]> & {
    queryKey: TQueryKey;
  };
  query.queryKey = queryKey as TQueryKey;
  return query;
}
export const getProjectSuspenseQueryKey = (
  projectId: GetProjectPathParams["project_id"],
) =>
  [
    { url: "/api/projects/:project_id", params: { projectId: projectId } },
  ] as const;
export type GetProjectSuspenseQueryKey = ReturnType<
  typeof getProjectSuspenseQueryKey
>;
export function getProjectSuspenseQueryOptions(
  projectId: GetProjectPathParams["project_id"],
  options: GetProject["client"]["parameters"] = {},
) {
  const queryKey = getProjectSuspenseQueryKey(projectId);
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await client<GetProject["data"], GetProject["error"]>({
        method: "get",
        url: `/api/projects/${projectId}`,
        ...options,
      });
      return res;
    },
  });
}
/**
 * @link /api/projects/:project_id
 */
export function useGetProjectSuspense<
  TData = GetProject["response"],
  TQueryKey extends QueryKey = GetProjectSuspenseQueryKey,
>(
  projectId: GetProjectPathParams["project_id"],
  options: {
    query?: Partial<
      UseSuspenseQueryOptions<
        GetProject["response"],
        GetProject["error"],
        TData,
        TQueryKey
      >
    >;
    client?: GetProject["client"]["parameters"];
  } = {},
): UseSuspenseQueryResult<TData, GetProject["error"]> & {
  queryKey: TQueryKey;
} {
  const { query: queryOptions, client: clientOptions = {} } = options ?? {};
  const queryKey =
    queryOptions?.queryKey ?? getProjectSuspenseQueryKey(projectId);
  const query = useSuspenseQuery({
    ...(getProjectSuspenseQueryOptions(
      projectId,
      clientOptions,
    ) as unknown as QueryObserverOptions),
    queryKey,
    ...(queryOptions as unknown as Omit<QueryObserverOptions, "queryKey">),
  }) as UseSuspenseQueryResult<TData, GetProject["error"]> & {
    queryKey: TQueryKey;
  };
  query.queryKey = queryKey as TQueryKey;
  return query;
}
