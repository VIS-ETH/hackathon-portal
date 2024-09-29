export type TimelineData = {
  /**
   * @type string, date-time
   */
  end?: string | null;
  /**
   * @type string, uuid
   */
  event_id: string;
  /**
   * @type object
   */
  scores: {
    [key: string]: (string & number)[][];
  };
  /**
   * @type string, date-time
   */
  start?: string | null;
};
