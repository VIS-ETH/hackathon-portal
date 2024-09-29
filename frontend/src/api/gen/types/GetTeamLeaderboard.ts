import type { FullInfoTeamEntryForLeaderboard } from "./FullInfoTeamEntryForLeaderboard";
import type { PublicError } from "./PublicError";

export type GetTeamLeaderboardQueryParams = {
  /**
   * @description The Event ID to get the leaderboard for
   * @type string, uuid
   */
  event_id: string;
};
export type GetTeamLeaderboard200 = FullInfoTeamEntryForLeaderboard[];
export type GetTeamLeaderboard500 = PublicError;
export type GetTeamLeaderboardQueryResponse = FullInfoTeamEntryForLeaderboard[];
export type GetTeamLeaderboardQuery = {
  Response: GetTeamLeaderboardQueryResponse;
  QueryParams: GetTeamLeaderboardQueryParams;
  Errors: GetTeamLeaderboard500;
};
