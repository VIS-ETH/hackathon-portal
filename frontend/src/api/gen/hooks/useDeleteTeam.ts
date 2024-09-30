import type {
  DeleteTeam500,
  DeleteTeamMutationResponse,
  DeleteTeamPathParams,
} from "../types/DeleteTeam";

import client from "@/api/client";

import { useMutation } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";

type DeleteTeamClient = typeof client<
  DeleteTeamMutationResponse,
  DeleteTeam500,
  never
>;
type DeleteTeam = {
  data: DeleteTeamMutationResponse;
  error: DeleteTeam500;
  request: never;
  pathParams: DeleteTeamPathParams;
  queryParams: never;
  headerParams: never;
  response: DeleteTeamMutationResponse;
  client: {
    parameters: Partial<Parameters<DeleteTeamClient>[0]>;
    return: Awaited<ReturnType<DeleteTeamClient>>;
  };
};
/**
 * @link /api/teams/:team_id
 */
export function useDeleteTeam(
  teamId: DeleteTeamPathParams["team_id"],
  options: {
    mutation?: UseMutationOptions<
      DeleteTeam["response"],
      DeleteTeam["error"],
      DeleteTeam["request"]
    >;
    client?: DeleteTeam["client"]["parameters"];
  } = {},
) {
  const { mutation: mutationOptions, client: clientOptions = {} } =
    options ?? {};
  return useMutation({
    mutationFn: async () => {
      const res = await client<
        DeleteTeam["data"],
        DeleteTeam["error"],
        DeleteTeam["request"]
      >({
        method: "delete",
        url: `/api/teams/${teamId}`,
        ...clientOptions,
      });
      return res;
    },
    ...mutationOptions,
  });
}
