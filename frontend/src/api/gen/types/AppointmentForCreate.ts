export type AppointmentForCreate = {
  /**
   * @type string
   */
  content?: string | null;
  /**
   * @type string
   */
  description?: string | null;
  /**
   * @type string, date-time
   */
  end?: string | null;
  /**
   * @type string, uuid
   */
  event_id: string;
  /**
   * @type string, date-time
   */
  start: string;
  /**
   * @type string
   */
  title: string;
};
