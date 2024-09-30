import type {
  DeleteTeamRoles500,
  DeleteTeamRolesMutationRequest,
  DeleteTeamRolesMutationResponse,
  DeleteTeamRolesPathParams,
} from "../types/DeleteTeamRoles";

import client from "@/api/client";

import { useMutation } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";

type DeleteTeamRolesClient = typeof client<
  DeleteTeamRolesMutationResponse,
  DeleteTeamRoles500,
  DeleteTeamRolesMutationRequest
>;
type DeleteTeamRoles = {
  data: DeleteTeamRolesMutationResponse;
  error: DeleteTeamRoles500;
  request: DeleteTeamRolesMutationRequest;
  pathParams: DeleteTeamRolesPathParams;
  queryParams: never;
  headerParams: never;
  response: DeleteTeamRolesMutationResponse;
  client: {
    parameters: Partial<Parameters<DeleteTeamRolesClient>[0]>;
    return: Awaited<ReturnType<DeleteTeamRolesClient>>;
  };
};
/**
 * @link /api/teams/:team_id/roles
 */
export function useDeleteTeamRoles(
  teamId: DeleteTeamRolesPathParams["team_id"],
  options: {
    mutation?: UseMutationOptions<
      DeleteTeamRoles["response"],
      DeleteTeamRoles["error"],
      DeleteTeamRoles["request"]
    >;
    client?: DeleteTeamRoles["client"]["parameters"];
  } = {},
) {
  const { mutation: mutationOptions, client: clientOptions = {} } =
    options ?? {};
  return useMutation({
    mutationFn: async (data) => {
      const res = await client<
        DeleteTeamRoles["data"],
        DeleteTeamRoles["error"],
        DeleteTeamRoles["request"]
      >({
        method: "delete",
        url: `/api/teams/${teamId}/roles`,
        data,
        ...clientOptions,
      });
      return res;
    },
    ...mutationOptions,
  });
}
