import type { PublicError } from "./PublicError";
import type { UserWithSidequestInfo } from "./UserWithSidequestInfo";

export type GetParticipantsWithSidequestInfoQueryParams = {
  /**
   * @description The Event ID to get the leaderboard for
   * @type string, uuid
   */
  event_id: string;
};
export type GetParticipantsWithSidequestInfo200 = UserWithSidequestInfo[];
export type GetParticipantsWithSidequestInfo500 = PublicError;
export type GetParticipantsWithSidequestInfoQueryResponse =
  UserWithSidequestInfo[];
export type GetParticipantsWithSidequestInfoQuery = {
  Response: GetParticipantsWithSidequestInfoQueryResponse;
  QueryParams: GetParticipantsWithSidequestInfoQueryParams;
  Errors: GetParticipantsWithSidequestInfo500;
};
