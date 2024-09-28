import type {
  PatchSidequests500,
  PatchSidequestsMutationRequest,
  PatchSidequestsMutationResponse,
  PatchSidequestsPathParams,
} from "../types/PatchSidequests";

import client from "@/api/client";

import { useMutation } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";

type PatchSidequestsClient = typeof client<
  PatchSidequestsMutationResponse,
  PatchSidequests500,
  PatchSidequestsMutationRequest
>;
type PatchSidequests = {
  data: PatchSidequestsMutationResponse;
  error: PatchSidequests500;
  request: PatchSidequestsMutationRequest;
  pathParams: PatchSidequestsPathParams;
  queryParams: never;
  headerParams: never;
  response: PatchSidequestsMutationResponse;
  client: {
    parameters: Partial<Parameters<PatchSidequestsClient>[0]>;
    return: Awaited<ReturnType<PatchSidequestsClient>>;
  };
};
/**
 * @link /api/sidequests/:sidequest_id
 */
export function usePatchSidequests(
  sidequestId: PatchSidequestsPathParams["sidequest_id"],
  options: {
    mutation?: UseMutationOptions<
      PatchSidequests["response"],
      PatchSidequests["error"],
      PatchSidequests["request"]
    >;
    client?: PatchSidequests["client"]["parameters"];
  } = {},
) {
  const { mutation: mutationOptions, client: clientOptions = {} } =
    options ?? {};
  return useMutation({
    mutationFn: async (data) => {
      const res = await client<
        PatchSidequests["data"],
        PatchSidequests["error"],
        PatchSidequests["request"]
      >({
        method: "patch",
        url: `/api/sidequests/${sidequestId}`,
        data,
        ...clientOptions,
      });
      return res.data;
    },
    ...mutationOptions,
  });
}
