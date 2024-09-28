import type {
  PostSidequestsAttempts500,
  PostSidequestsAttemptsMutationRequest,
  PostSidequestsAttemptsMutationResponse,
  PostSidequestsAttemptsPathParams,
} from "../types/PostSidequestsAttempts";

import client from "@/api/client";

import { useMutation } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";

type PostSidequestsAttemptsClient = typeof client<
  PostSidequestsAttemptsMutationResponse,
  PostSidequestsAttempts500,
  PostSidequestsAttemptsMutationRequest
>;
type PostSidequestsAttempts = {
  data: PostSidequestsAttemptsMutationResponse;
  error: PostSidequestsAttempts500;
  request: PostSidequestsAttemptsMutationRequest;
  pathParams: PostSidequestsAttemptsPathParams;
  queryParams: never;
  headerParams: never;
  response: PostSidequestsAttemptsMutationResponse;
  client: {
    parameters: Partial<Parameters<PostSidequestsAttemptsClient>[0]>;
    return: Awaited<ReturnType<PostSidequestsAttemptsClient>>;
  };
};
/**
 * @link /api/sidequests/:sidequest_id/attempts
 */
export function usePostSidequestsAttempts(
  sidequestId: PostSidequestsAttemptsPathParams["sidequest_id"],
  options: {
    mutation?: UseMutationOptions<
      PostSidequestsAttempts["response"],
      PostSidequestsAttempts["error"],
      PostSidequestsAttempts["request"]
    >;
    client?: PostSidequestsAttempts["client"]["parameters"];
  } = {},
) {
  const { mutation: mutationOptions, client: clientOptions = {} } =
    options ?? {};
  return useMutation({
    mutationFn: async (data) => {
      const res = await client<
        PostSidequestsAttempts["data"],
        PostSidequestsAttempts["error"],
        PostSidequestsAttempts["request"]
      >({
        method: "post",
        url: `/api/sidequests/${sidequestId}/attempts`,
        data,
        ...clientOptions,
      });
      return res.data;
    },
    ...mutationOptions,
  });
}
