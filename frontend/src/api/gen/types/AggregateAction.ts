import type { AggregationAction } from "./AggregationAction";
import type { AggregatorStatus } from "./AggregatorStatus";
import type { PublicError } from "./PublicError";

export type AggregateActionPathParams = {
  /**
   * @type string, uuid
   */
  event_id: string;
};
export type AggregateActionQueryParams = {
  aggregate_action: AggregationAction;
};
export type AggregateAction200 = AggregatorStatus;
export type AggregateAction500 = PublicError;
export type AggregateActionMutationResponse = AggregatorStatus;
export type AggregateActionMutation = {
  Response: AggregateActionMutationResponse;
  PathParams: AggregateActionPathParams;
  QueryParams: AggregateActionQueryParams;
  Errors: AggregateAction500;
};
