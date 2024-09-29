import type {
  InviteUsers500,
  InviteUsersMutationRequest,
  InviteUsersMutationResponse,
  InviteUsersPathParams,
} from "../types/InviteUsers";

import client from "@/api/client";

import { useMutation } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";

type InviteUsersClient = typeof client<
  InviteUsersMutationResponse,
  InviteUsers500,
  InviteUsersMutationRequest
>;
type InviteUsers = {
  data: InviteUsersMutationResponse;
  error: InviteUsers500;
  request: InviteUsersMutationRequest;
  pathParams: InviteUsersPathParams;
  queryParams: never;
  headerParams: never;
  response: InviteUsersMutationResponse;
  client: {
    parameters: Partial<Parameters<InviteUsersClient>[0]>;
    return: Awaited<ReturnType<InviteUsersClient>>;
  };
};
/**
 * @link /api/events/:event_id/invite
 */
export function useInviteUsers(
  eventId: InviteUsersPathParams["event_id"],
  options: {
    mutation?: UseMutationOptions<
      InviteUsers["response"],
      InviteUsers["error"],
      InviteUsers["request"]
    >;
    client?: InviteUsers["client"]["parameters"];
  } = {},
) {
  const { mutation: mutationOptions, client: clientOptions = {} } =
    options ?? {};
  return useMutation({
    mutationFn: async (data) => {
      const res = await client<
        InviteUsers["data"],
        InviteUsers["error"],
        InviteUsers["request"]
      >({
        method: "post",
        url: `/api/events/${eventId}/invite`,
        data,
        ...clientOptions,
      });
      return res;
    },
    ...mutationOptions,
  });
}
