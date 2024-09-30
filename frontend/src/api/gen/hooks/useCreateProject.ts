import type {
  CreateProject500,
  CreateProjectMutationRequest,
  CreateProjectMutationResponse,
} from "../types/CreateProject";

import client from "@/api/client";

import { useMutation } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";

type CreateProjectClient = typeof client<
  CreateProjectMutationResponse,
  CreateProject500,
  CreateProjectMutationRequest
>;
type CreateProject = {
  data: CreateProjectMutationResponse;
  error: CreateProject500;
  request: CreateProjectMutationRequest;
  pathParams: never;
  queryParams: never;
  headerParams: never;
  response: CreateProjectMutationResponse;
  client: {
    parameters: Partial<Parameters<CreateProjectClient>[0]>;
    return: Awaited<ReturnType<CreateProjectClient>>;
  };
};
/**
 * @link /api/projects
 */
export function useCreateProject(
  options: {
    mutation?: UseMutationOptions<
      CreateProject["response"],
      CreateProject["error"],
      CreateProject["request"]
    >;
    client?: CreateProject["client"]["parameters"];
  } = {},
) {
  const { mutation: mutationOptions, client: clientOptions = {} } =
    options ?? {};
  return useMutation({
    mutationFn: async (data) => {
      const res = await client<
        CreateProject["data"],
        CreateProject["error"],
        CreateProject["request"]
      >({
        method: "post",
        url: `/api/projects`,
        data,
        ...clientOptions,
      });
      return res;
    },
    ...mutationOptions,
  });
}
