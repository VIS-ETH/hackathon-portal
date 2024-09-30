import type {
  UpdateTeamProjectPreferences500,
  UpdateTeamProjectPreferencesMutationRequest,
  UpdateTeamProjectPreferencesMutationResponse,
  UpdateTeamProjectPreferencesPathParams,
} from "../types/UpdateTeamProjectPreferences";

import client from "@/api/client";

import { useMutation } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";

type UpdateTeamProjectPreferencesClient = typeof client<
  UpdateTeamProjectPreferencesMutationResponse,
  UpdateTeamProjectPreferences500,
  UpdateTeamProjectPreferencesMutationRequest
>;
type UpdateTeamProjectPreferences = {
  data: UpdateTeamProjectPreferencesMutationResponse;
  error: UpdateTeamProjectPreferences500;
  request: UpdateTeamProjectPreferencesMutationRequest;
  pathParams: UpdateTeamProjectPreferencesPathParams;
  queryParams: never;
  headerParams: never;
  response: UpdateTeamProjectPreferencesMutationResponse;
  client: {
    parameters: Partial<Parameters<UpdateTeamProjectPreferencesClient>[0]>;
    return: Awaited<ReturnType<UpdateTeamProjectPreferencesClient>>;
  };
};
/**
 * @link /api/teams/:team_id/project-preferences
 */
export function useUpdateTeamProjectPreferences(
  teamId: UpdateTeamProjectPreferencesPathParams["team_id"],
  options: {
    mutation?: UseMutationOptions<
      UpdateTeamProjectPreferences["response"],
      UpdateTeamProjectPreferences["error"],
      UpdateTeamProjectPreferences["request"]
    >;
    client?: UpdateTeamProjectPreferences["client"]["parameters"];
  } = {},
) {
  const { mutation: mutationOptions, client: clientOptions = {} } =
    options ?? {};
  return useMutation({
    mutationFn: async (data) => {
      const res = await client<
        UpdateTeamProjectPreferences["data"],
        UpdateTeamProjectPreferences["error"],
        UpdateTeamProjectPreferences["request"]
      >({
        method: "patch",
        url: `/api/teams/${teamId}/project-preferences`,
        data,
        ...clientOptions,
      });
      return res;
    },
    ...mutationOptions,
  });
}
