import type { EventDto } from "./EventDto";
import type { EventForPatch } from "./EventForPatch";
import type { PublicError } from "./PublicError";

export type PatchEventPathParams = {
  /**
   * @type string, uuid
   */
  event_id: string;
};
export type PatchEvent200 = EventDto;
export type PatchEvent500 = PublicError;
export type PatchEventMutationRequest = EventForPatch;
export type PatchEventMutationResponse = EventDto;
export type PatchEventMutation = {
  Response: PatchEventMutationResponse;
  Request: PatchEventMutationRequest;
  PathParams: PatchEventPathParams;
  Errors: PatchEvent500;
};
