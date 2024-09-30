import type {
  DeleteProject500,
  DeleteProjectMutationResponse,
  DeleteProjectPathParams,
} from "../types/DeleteProject";

import client from "@/api/client";

import { useMutation } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";

type DeleteProjectClient = typeof client<
  DeleteProjectMutationResponse,
  DeleteProject500,
  never
>;
type DeleteProject = {
  data: DeleteProjectMutationResponse;
  error: DeleteProject500;
  request: never;
  pathParams: DeleteProjectPathParams;
  queryParams: never;
  headerParams: never;
  response: DeleteProjectMutationResponse;
  client: {
    parameters: Partial<Parameters<DeleteProjectClient>[0]>;
    return: Awaited<ReturnType<DeleteProjectClient>>;
  };
};
/**
 * @link /api/projects/:project_id
 */
export function useDeleteProject(
  projectId: DeleteProjectPathParams["project_id"],
  options: {
    mutation?: UseMutationOptions<
      DeleteProject["response"],
      DeleteProject["error"],
      DeleteProject["request"]
    >;
    client?: DeleteProject["client"]["parameters"];
  } = {},
) {
  const { mutation: mutationOptions, client: clientOptions = {} } =
    options ?? {};
  return useMutation({
    mutationFn: async () => {
      const res = await client<
        DeleteProject["data"],
        DeleteProject["error"],
        DeleteProject["request"]
      >({
        method: "delete",
        url: `/api/projects/${projectId}`,
        ...clientOptions,
      });
      return res;
    },
    ...mutationOptions,
  });
}
