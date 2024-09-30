import type { AggregatorStatus } from "./AggregatorStatus";
import type { PublicError } from "./PublicError";

export type UpdateTeamsIndexPathParams = {
  /**
   * @type string, uuid
   */
  event_id: string;
};
export type UpdateTeamsIndex200 = AggregatorStatus;
export type UpdateTeamsIndex500 = PublicError;
export type UpdateTeamsIndexMutationResponse = AggregatorStatus;
export type UpdateTeamsIndexMutation = {
  Response: UpdateTeamsIndexMutationResponse;
  PathParams: UpdateTeamsIndexPathParams;
  Errors: UpdateTeamsIndex500;
};
