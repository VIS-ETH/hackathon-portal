import type {
  PutEventRoles500,
  PutEventRolesMutationRequest,
  PutEventRolesMutationResponse,
  PutEventRolesPathParams,
} from "../types/PutEventRoles";

import client from "@/api/client";

import { useMutation } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";

type PutEventRolesClient = typeof client<
  PutEventRolesMutationResponse,
  PutEventRoles500,
  PutEventRolesMutationRequest
>;
type PutEventRoles = {
  data: PutEventRolesMutationResponse;
  error: PutEventRoles500;
  request: PutEventRolesMutationRequest;
  pathParams: PutEventRolesPathParams;
  queryParams: never;
  headerParams: never;
  response: PutEventRolesMutationResponse;
  client: {
    parameters: Partial<Parameters<PutEventRolesClient>[0]>;
    return: Awaited<ReturnType<PutEventRolesClient>>;
  };
};
/**
 * @link /api/events/:event_id/roles
 */
export function usePutEventRoles(
  eventId: PutEventRolesPathParams["event_id"],
  options: {
    mutation?: UseMutationOptions<
      PutEventRoles["response"],
      PutEventRoles["error"],
      PutEventRoles["request"]
    >;
    client?: PutEventRoles["client"]["parameters"];
  } = {},
) {
  const { mutation: mutationOptions, client: clientOptions = {} } =
    options ?? {};
  return useMutation({
    mutationFn: async (data) => {
      const res = await client<
        PutEventRoles["data"],
        PutEventRoles["error"],
        PutEventRoles["request"]
      >({
        method: "put",
        url: `/api/events/${eventId}/roles`,
        data,
        ...clientOptions,
      });
      return res.data;
    },
    ...mutationOptions,
  });
}
