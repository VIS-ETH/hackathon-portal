import type { PublicError } from "./PublicError";
import type { SidequestDto } from "./SidequestDto";

export type GetSidequestsQueryParams = {
  /**
   * @description The ID of the event to get sidequests for
   * @type string, uuid
   */
  event_id: string;
};
export type GetSidequests200 = SidequestDto[];
export type GetSidequests500 = PublicError;
export type GetSidequestsQueryResponse = SidequestDto[];
export type GetSidequestsQuery = {
  Response: GetSidequestsQueryResponse;
  QueryParams: GetSidequestsQueryParams;
  Errors: GetSidequests500;
};
