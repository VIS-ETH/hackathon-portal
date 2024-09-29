export type UserWithSidequestInfo = {
  /**
   * @type boolean
   */
  allowed: boolean;
  /**
   * @type string, date-time
   */
  allowed_at?: string | null;
  /**
   * @type string, date-time
   */
  last_quest?: string | null;
  /**
   * @type string, uuid
   */
  user_id: string;
  /**
   * @type string
   */
  user_name: string;
};
