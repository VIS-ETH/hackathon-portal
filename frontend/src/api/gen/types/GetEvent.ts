import type { EventDto } from "./EventDto";
import type { PublicError } from "./PublicError";

export type GetEventPathParams = {
  /**
   * @type string, uuid
   */
  event_id: string;
};
export type GetEvent200 = EventDto;
export type GetEvent500 = PublicError;
export type GetEventQueryResponse = EventDto;
export type GetEventQuery = {
  Response: GetEventQueryResponse;
  PathParams: GetEventPathParams;
  Errors: GetEvent500;
};
