import type { PublicError } from "./PublicError";
import type { SidequestDto } from "./SidequestDto";
import type { SidequestForPatch } from "./SidequestForPatch";

export type PatchSidequestsPathParams = {
  /**
   * @type string, uuid
   */
  sidequest_id: string;
};
export type PatchSidequests200 = SidequestDto;
export type PatchSidequests500 = PublicError;
export type PatchSidequestsMutationRequest = SidequestForPatch;
export type PatchSidequestsMutationResponse = SidequestDto;
export type PatchSidequestsMutation = {
  Response: PatchSidequestsMutationResponse;
  Request: PatchSidequestsMutationRequest;
  PathParams: PatchSidequestsPathParams;
  Errors: PatchSidequests500;
};
