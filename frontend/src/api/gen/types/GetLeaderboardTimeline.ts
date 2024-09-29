import type { PublicError } from "./PublicError";
import type { TimelineData } from "./TimelineData";

export type GetLeaderboardTimelineQueryParams = {
  /**
   * @description The Event ID to get the leaderboard for
   * @type string, uuid
   */
  event_id: string;
  /**
   * @description Only return entries before this time
   * @type string, date-time
   */
  before?: string | null;
  /**
   * @description Only return entries after this time
   * @type string, date-time
   */
  after?: string | null;
};
export type GetLeaderboardTimeline200 = TimelineData;
export type GetLeaderboardTimeline500 = PublicError;
export type GetLeaderboardTimelineQueryResponse = TimelineData;
export type GetLeaderboardTimelineQuery = {
  Response: GetLeaderboardTimelineQueryResponse;
  QueryParams: GetLeaderboardTimelineQueryParams;
  Errors: GetLeaderboardTimeline500;
};
