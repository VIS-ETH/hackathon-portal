import type {
  PostSidequests500,
  PostSidequestsMutationRequest,
  PostSidequestsMutationResponse,
} from "../types/PostSidequests";

import client from "@/api/client";

import { useMutation } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";

type PostSidequestsClient = typeof client<
  PostSidequestsMutationResponse,
  PostSidequests500,
  PostSidequestsMutationRequest
>;
type PostSidequests = {
  data: PostSidequestsMutationResponse;
  error: PostSidequests500;
  request: PostSidequestsMutationRequest;
  pathParams: never;
  queryParams: never;
  headerParams: never;
  response: PostSidequestsMutationResponse;
  client: {
    parameters: Partial<Parameters<PostSidequestsClient>[0]>;
    return: Awaited<ReturnType<PostSidequestsClient>>;
  };
};
/**
 * @link /api/sidequests
 */
export function usePostSidequests(
  options: {
    mutation?: UseMutationOptions<
      PostSidequests["response"],
      PostSidequests["error"],
      PostSidequests["request"]
    >;
    client?: PostSidequests["client"]["parameters"];
  } = {},
) {
  const { mutation: mutationOptions, client: clientOptions = {} } =
    options ?? {};
  return useMutation({
    mutationFn: async (data) => {
      const res = await client<
        PostSidequests["data"],
        PostSidequests["error"],
        PostSidequests["request"]
      >({
        method: "post",
        url: `/api/sidequests`,
        data,
        ...clientOptions,
      });
      return res;
    },
    ...mutationOptions,
  });
}
