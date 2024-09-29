import type {
  PatchEvent500,
  PatchEventMutationRequest,
  PatchEventMutationResponse,
  PatchEventPathParams,
} from "../types/PatchEvent";

import client from "@/api/client";

import { useMutation } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";

type PatchEventClient = typeof client<
  PatchEventMutationResponse,
  PatchEvent500,
  PatchEventMutationRequest
>;
type PatchEvent = {
  data: PatchEventMutationResponse;
  error: PatchEvent500;
  request: PatchEventMutationRequest;
  pathParams: PatchEventPathParams;
  queryParams: never;
  headerParams: never;
  response: PatchEventMutationResponse;
  client: {
    parameters: Partial<Parameters<PatchEventClient>[0]>;
    return: Awaited<ReturnType<PatchEventClient>>;
  };
};
/**
 * @link /api/events/:event_id
 */
export function usePatchEvent(
  eventId: PatchEventPathParams["event_id"],
  options: {
    mutation?: UseMutationOptions<
      PatchEvent["response"],
      PatchEvent["error"],
      PatchEvent["request"]
    >;
    client?: PatchEvent["client"]["parameters"];
  } = {},
) {
  const { mutation: mutationOptions, client: clientOptions = {} } =
    options ?? {};
  return useMutation({
    mutationFn: async (data) => {
      const res = await client<
        PatchEvent["data"],
        PatchEvent["error"],
        PatchEvent["request"]
      >({
        method: "patch",
        url: `/api/events/${eventId}`,
        data,
        ...clientOptions,
      });
      return res;
    },
    ...mutationOptions,
  });
}
