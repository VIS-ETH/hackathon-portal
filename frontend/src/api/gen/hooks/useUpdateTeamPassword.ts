import type {
  UpdateTeamPassword500,
  UpdateTeamPasswordMutationRequest,
  UpdateTeamPasswordMutationResponse,
  UpdateTeamPasswordPathParams,
} from "../types/UpdateTeamPassword";

import client from "@/api/client";

import { useMutation } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";

type UpdateTeamPasswordClient = typeof client<
  UpdateTeamPasswordMutationResponse,
  UpdateTeamPassword500,
  UpdateTeamPasswordMutationRequest
>;
type UpdateTeamPassword = {
  data: UpdateTeamPasswordMutationResponse;
  error: UpdateTeamPassword500;
  request: UpdateTeamPasswordMutationRequest;
  pathParams: UpdateTeamPasswordPathParams;
  queryParams: never;
  headerParams: never;
  response: UpdateTeamPasswordMutationResponse;
  client: {
    parameters: Partial<Parameters<UpdateTeamPasswordClient>[0]>;
    return: Awaited<ReturnType<UpdateTeamPasswordClient>>;
  };
};
/**
 * @link /api/teams/:team_id/password
 */
export function useUpdateTeamPassword(
  teamId: UpdateTeamPasswordPathParams["team_id"],
  options: {
    mutation?: UseMutationOptions<
      UpdateTeamPassword["response"],
      UpdateTeamPassword["error"],
      UpdateTeamPassword["request"]
    >;
    client?: UpdateTeamPassword["client"]["parameters"];
  } = {},
) {
  const { mutation: mutationOptions, client: clientOptions = {} } =
    options ?? {};
  return useMutation({
    mutationFn: async (data) => {
      const res = await client<
        UpdateTeamPassword["data"],
        UpdateTeamPassword["error"],
        UpdateTeamPassword["request"]
      >({
        method: "patch",
        url: `/api/teams/${teamId}/password`,
        data,
        ...clientOptions,
      });
      return res;
    },
    ...mutationOptions,
  });
}
