import type { PublicError } from "./PublicError";
import type { SidequestDto } from "./SidequestDto";

export type GetSidequestPathParams = {
  /**
   * @type string, uuid
   */
  sidequest_id: string;
};
export type GetSidequest200 = SidequestDto;
export type GetSidequest500 = PublicError;
export type GetSidequestQueryResponse = SidequestDto;
export type GetSidequestQuery = {
  Response: GetSidequestQueryResponse;
  PathParams: GetSidequestPathParams;
  Errors: GetSidequest500;
};
