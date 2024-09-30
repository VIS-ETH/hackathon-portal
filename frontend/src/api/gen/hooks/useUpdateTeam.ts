import type {
  UpdateTeam500,
  UpdateTeamMutationRequest,
  UpdateTeamMutationResponse,
  UpdateTeamPathParams,
} from "../types/UpdateTeam";

import client from "@/api/client";

import { useMutation } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";

type UpdateTeamClient = typeof client<
  UpdateTeamMutationResponse,
  UpdateTeam500,
  UpdateTeamMutationRequest
>;
type UpdateTeam = {
  data: UpdateTeamMutationResponse;
  error: UpdateTeam500;
  request: UpdateTeamMutationRequest;
  pathParams: UpdateTeamPathParams;
  queryParams: never;
  headerParams: never;
  response: UpdateTeamMutationResponse;
  client: {
    parameters: Partial<Parameters<UpdateTeamClient>[0]>;
    return: Awaited<ReturnType<UpdateTeamClient>>;
  };
};
/**
 * @link /api/teams/:team_id
 */
export function useUpdateTeam(
  teamId: UpdateTeamPathParams["team_id"],
  options: {
    mutation?: UseMutationOptions<
      UpdateTeam["response"],
      UpdateTeam["error"],
      UpdateTeam["request"]
    >;
    client?: UpdateTeam["client"]["parameters"];
  } = {},
) {
  const { mutation: mutationOptions, client: clientOptions = {} } =
    options ?? {};
  return useMutation({
    mutationFn: async (data) => {
      const res = await client<
        UpdateTeam["data"],
        UpdateTeam["error"],
        UpdateTeam["request"]
      >({
        method: "patch",
        url: `/api/teams/${teamId}`,
        data,
        ...clientOptions,
      });
      return res;
    },
    ...mutationOptions,
  });
}
