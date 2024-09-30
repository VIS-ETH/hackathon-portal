import type {
  CreateTeam500,
  CreateTeamMutationRequest,
  CreateTeamMutationResponse,
} from "../types/CreateTeam";

import client from "@/api/client";

import { useMutation } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";

type CreateTeamClient = typeof client<
  CreateTeamMutationResponse,
  CreateTeam500,
  CreateTeamMutationRequest
>;
type CreateTeam = {
  data: CreateTeamMutationResponse;
  error: CreateTeam500;
  request: CreateTeamMutationRequest;
  pathParams: never;
  queryParams: never;
  headerParams: never;
  response: CreateTeamMutationResponse;
  client: {
    parameters: Partial<Parameters<CreateTeamClient>[0]>;
    return: Awaited<ReturnType<CreateTeamClient>>;
  };
};
/**
 * @link /api/teams
 */
export function useCreateTeam(
  options: {
    mutation?: UseMutationOptions<
      CreateTeam["response"],
      CreateTeam["error"],
      CreateTeam["request"]
    >;
    client?: CreateTeam["client"]["parameters"];
  } = {},
) {
  const { mutation: mutationOptions, client: clientOptions = {} } =
    options ?? {};
  return useMutation({
    mutationFn: async (data) => {
      const res = await client<
        CreateTeam["data"],
        CreateTeam["error"],
        CreateTeam["request"]
      >({
        method: "post",
        url: `/api/teams`,
        data,
        ...clientOptions,
      });
      return res;
    },
    ...mutationOptions,
  });
}
