import type {
  AggregateAction500,
  AggregateActionMutationResponse,
  AggregateActionPathParams,
  AggregateActionQueryParams,
} from "../types/AggregateAction";

import client from "@/api/client";

import { useMutation } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";

type AggregateActionClient = typeof client<
  AggregateActionMutationResponse,
  AggregateAction500,
  never
>;
type AggregateAction = {
  data: AggregateActionMutationResponse;
  error: AggregateAction500;
  request: never;
  pathParams: AggregateActionPathParams;
  queryParams: AggregateActionQueryParams;
  headerParams: never;
  response: AggregateActionMutationResponse;
  client: {
    parameters: Partial<Parameters<AggregateActionClient>[0]>;
    return: Awaited<ReturnType<AggregateActionClient>>;
  };
};
/**
 * @link /api/events/:event_id/aggregate
 */
export function useAggregateAction(
  eventId: AggregateActionPathParams["event_id"],
  params: AggregateAction["queryParams"],
  options: {
    mutation?: UseMutationOptions<
      AggregateAction["response"],
      AggregateAction["error"],
      AggregateAction["request"]
    >;
    client?: AggregateAction["client"]["parameters"];
  } = {},
) {
  const { mutation: mutationOptions, client: clientOptions = {} } =
    options ?? {};
  return useMutation({
    mutationFn: async () => {
      const res = await client<
        AggregateAction["data"],
        AggregateAction["error"],
        AggregateAction["request"]
      >({
        method: "post",
        url: `/api/events/${eventId}/aggregate`,
        params,
        ...clientOptions,
      });
      return res;
    },
    ...mutationOptions,
  });
}
