import type {
  UpdateTeamProject500,
  UpdateTeamProjectMutationRequest,
  UpdateTeamProjectMutationResponse,
  UpdateTeamProjectPathParams,
} from "../types/UpdateTeamProject";

import client from "@/api/client";

import { useMutation } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";

type UpdateTeamProjectClient = typeof client<
  UpdateTeamProjectMutationResponse,
  UpdateTeamProject500,
  UpdateTeamProjectMutationRequest
>;
type UpdateTeamProject = {
  data: UpdateTeamProjectMutationResponse;
  error: UpdateTeamProject500;
  request: UpdateTeamProjectMutationRequest;
  pathParams: UpdateTeamProjectPathParams;
  queryParams: never;
  headerParams: never;
  response: UpdateTeamProjectMutationResponse;
  client: {
    parameters: Partial<Parameters<UpdateTeamProjectClient>[0]>;
    return: Awaited<ReturnType<UpdateTeamProjectClient>>;
  };
};
/**
 * @link /api/teams/:team_id/project
 */
export function useUpdateTeamProject(
  teamId: UpdateTeamProjectPathParams["team_id"],
  options: {
    mutation?: UseMutationOptions<
      UpdateTeamProject["response"],
      UpdateTeamProject["error"],
      UpdateTeamProject["request"]
    >;
    client?: UpdateTeamProject["client"]["parameters"];
  } = {},
) {
  const { mutation: mutationOptions, client: clientOptions = {} } =
    options ?? {};
  return useMutation({
    mutationFn: async (data) => {
      const res = await client<
        UpdateTeamProject["data"],
        UpdateTeamProject["error"],
        UpdateTeamProject["request"]
      >({
        method: "patch",
        url: `/api/teams/${teamId}/project`,
        data,
        ...clientOptions,
      });
      return res;
    },
    ...mutationOptions,
  });
}
