import type { AggregatorStatus } from "./AggregatorStatus";
import type { PublicError } from "./PublicError";

export type GetAggregateStatusPathParams = {
  /**
   * @type string, uuid
   */
  event_id: string;
};
export type GetAggregateStatus200 = AggregatorStatus;
export type GetAggregateStatus500 = PublicError;
export type GetAggregateStatusQueryResponse = AggregatorStatus;
export type GetAggregateStatusQuery = {
  Response: GetAggregateStatusQueryResponse;
  PathParams: GetAggregateStatusPathParams;
  Errors: GetAggregateStatus500;
};
