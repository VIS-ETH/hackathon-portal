import type {
  UpdateProject500,
  UpdateProjectMutationRequest,
  UpdateProjectMutationResponse,
  UpdateProjectPathParams,
} from "../types/UpdateProject";

import client from "@/api/client";

import { useMutation } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";

type UpdateProjectClient = typeof client<
  UpdateProjectMutationResponse,
  UpdateProject500,
  UpdateProjectMutationRequest
>;
type UpdateProject = {
  data: UpdateProjectMutationResponse;
  error: UpdateProject500;
  request: UpdateProjectMutationRequest;
  pathParams: UpdateProjectPathParams;
  queryParams: never;
  headerParams: never;
  response: UpdateProjectMutationResponse;
  client: {
    parameters: Partial<Parameters<UpdateProjectClient>[0]>;
    return: Awaited<ReturnType<UpdateProjectClient>>;
  };
};
/**
 * @link /api/projects/:project_id
 */
export function useUpdateProject(
  projectId: UpdateProjectPathParams["project_id"],
  options: {
    mutation?: UseMutationOptions<
      UpdateProject["response"],
      UpdateProject["error"],
      UpdateProject["request"]
    >;
    client?: UpdateProject["client"]["parameters"];
  } = {},
) {
  const { mutation: mutationOptions, client: clientOptions = {} } =
    options ?? {};
  return useMutation({
    mutationFn: async (data) => {
      const res = await client<
        UpdateProject["data"],
        UpdateProject["error"],
        UpdateProject["request"]
      >({
        method: "patch",
        url: `/api/projects/${projectId}`,
        data,
        ...clientOptions,
      });
      return res;
    },
    ...mutationOptions,
  });
}
