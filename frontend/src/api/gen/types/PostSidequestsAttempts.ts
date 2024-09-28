import type { AttemptForCreate } from "./AttemptForCreate";
import type { PublicError } from "./PublicError";

export type PostSidequestsAttemptsPathParams = {
  /**
   * @type string, uuid
   */
  sidequest_id: string;
};
export type PostSidequestsAttempts200 = number;
export type PostSidequestsAttempts500 = PublicError;
export type PostSidequestsAttemptsMutationRequest = AttemptForCreate;
export type PostSidequestsAttemptsMutationResponse = number;
export type PostSidequestsAttemptsMutation = {
  Response: PostSidequestsAttemptsMutationResponse;
  Request: PostSidequestsAttemptsMutationRequest;
  PathParams: PostSidequestsAttemptsPathParams;
  Errors: PostSidequestsAttempts500;
};
