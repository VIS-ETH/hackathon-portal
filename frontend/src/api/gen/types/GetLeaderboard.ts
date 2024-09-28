import type { FullInfoSidequestEntryForLeaderboard } from "./FullInfoSidequestEntryForLeaderboard";
import type { PublicError } from "./PublicError";

export type GetLeaderboardPathParams = {
  /**
   * @type string, uuid
   */
  sidequest_id: string;
};
export type GetLeaderboard200 = FullInfoSidequestEntryForLeaderboard[];
export type GetLeaderboard500 = PublicError;
export type GetLeaderboardQueryResponse =
  FullInfoSidequestEntryForLeaderboard[];
export type GetLeaderboardQuery = {
  Response: GetLeaderboardQueryResponse;
  PathParams: GetLeaderboardPathParams;
  Errors: GetLeaderboard500;
};
