export type EventLeaderboardTimelineQuery = {
  /**
   * @type string, date-time
   */
  after?: string | null;
  /**
   * @type string, date-time
   */
  before?: string | null;
  /**
   * @type string, uuid
   */
  event_id: string;
};
