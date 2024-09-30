import type {
  UpdateTeamsIndex500,
  UpdateTeamsIndexMutationResponse,
  UpdateTeamsIndexPathParams,
} from "../types/UpdateTeamsIndex";

import client from "@/api/client";

import { useMutation } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";

type UpdateTeamsIndexClient = typeof client<
  UpdateTeamsIndexMutationResponse,
  UpdateTeamsIndex500,
  never
>;
type UpdateTeamsIndex = {
  data: UpdateTeamsIndexMutationResponse;
  error: UpdateTeamsIndex500;
  request: never;
  pathParams: UpdateTeamsIndexPathParams;
  queryParams: never;
  headerParams: never;
  response: UpdateTeamsIndexMutationResponse;
  client: {
    parameters: Partial<Parameters<UpdateTeamsIndexClient>[0]>;
    return: Awaited<ReturnType<UpdateTeamsIndexClient>>;
  };
};
/**
 * @link /api/events/:event_id/teams/index
 */
export function useUpdateTeamsIndex(
  eventId: UpdateTeamsIndexPathParams["event_id"],
  options: {
    mutation?: UseMutationOptions<
      UpdateTeamsIndex["response"],
      UpdateTeamsIndex["error"],
      UpdateTeamsIndex["request"]
    >;
    client?: UpdateTeamsIndex["client"]["parameters"];
  } = {},
) {
  const { mutation: mutationOptions, client: clientOptions = {} } =
    options ?? {};
  return useMutation({
    mutationFn: async () => {
      const res = await client<
        UpdateTeamsIndex["data"],
        UpdateTeamsIndex["error"],
        UpdateTeamsIndex["request"]
      >({
        method: "post",
        url: `/api/events/${eventId}/teams/index`,
        ...clientOptions,
      });
      return res;
    },
    ...mutationOptions,
  });
}
