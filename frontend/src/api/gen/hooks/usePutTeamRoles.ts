import type {
  PutTeamRoles500,
  PutTeamRolesMutationRequest,
  PutTeamRolesMutationResponse,
  PutTeamRolesPathParams,
} from "../types/PutTeamRoles";

import client from "@/api/client";

import { useMutation } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";

type PutTeamRolesClient = typeof client<
  PutTeamRolesMutationResponse,
  PutTeamRoles500,
  PutTeamRolesMutationRequest
>;
type PutTeamRoles = {
  data: PutTeamRolesMutationResponse;
  error: PutTeamRoles500;
  request: PutTeamRolesMutationRequest;
  pathParams: PutTeamRolesPathParams;
  queryParams: never;
  headerParams: never;
  response: PutTeamRolesMutationResponse;
  client: {
    parameters: Partial<Parameters<PutTeamRolesClient>[0]>;
    return: Awaited<ReturnType<PutTeamRolesClient>>;
  };
};
/**
 * @link /api/teams/:team_id/roles
 */
export function usePutTeamRoles(
  teamId: PutTeamRolesPathParams["team_id"],
  options: {
    mutation?: UseMutationOptions<
      PutTeamRoles["response"],
      PutTeamRoles["error"],
      PutTeamRoles["request"]
    >;
    client?: PutTeamRoles["client"]["parameters"];
  } = {},
) {
  const { mutation: mutationOptions, client: clientOptions = {} } =
    options ?? {};
  return useMutation({
    mutationFn: async (data) => {
      const res = await client<
        PutTeamRoles["data"],
        PutTeamRoles["error"],
        PutTeamRoles["request"]
      >({
        method: "put",
        url: `/api/teams/${teamId}/roles`,
        data,
        ...clientOptions,
      });
      return res;
    },
    ...mutationOptions,
  });
}
