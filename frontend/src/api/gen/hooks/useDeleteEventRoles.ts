import type {
  DeleteEventRoles500,
  DeleteEventRolesMutationRequest,
  DeleteEventRolesMutationResponse,
  DeleteEventRolesPathParams,
} from "../types/DeleteEventRoles";

import client from "@/api/client";

import { useMutation } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";

type DeleteEventRolesClient = typeof client<
  DeleteEventRolesMutationResponse,
  DeleteEventRoles500,
  DeleteEventRolesMutationRequest
>;
type DeleteEventRoles = {
  data: DeleteEventRolesMutationResponse;
  error: DeleteEventRoles500;
  request: DeleteEventRolesMutationRequest;
  pathParams: DeleteEventRolesPathParams;
  queryParams: never;
  headerParams: never;
  response: DeleteEventRolesMutationResponse;
  client: {
    parameters: Partial<Parameters<DeleteEventRolesClient>[0]>;
    return: Awaited<ReturnType<DeleteEventRolesClient>>;
  };
};
/**
 * @link /api/events/:event_id/roles
 */
export function useDeleteEventRoles(
  eventId: DeleteEventRolesPathParams["event_id"],
  options: {
    mutation?: UseMutationOptions<
      DeleteEventRoles["response"],
      DeleteEventRoles["error"],
      DeleteEventRoles["request"]
    >;
    client?: DeleteEventRoles["client"]["parameters"];
  } = {},
) {
  const { mutation: mutationOptions, client: clientOptions = {} } =
    options ?? {};
  return useMutation({
    mutationFn: async (data) => {
      const res = await client<
        DeleteEventRoles["data"],
        DeleteEventRoles["error"],
        DeleteEventRoles["request"]
      >({
        method: "delete",
        url: `/api/events/${eventId}/roles`,
        data,
        ...clientOptions,
      });
      return res;
    },
    ...mutationOptions,
  });
}
