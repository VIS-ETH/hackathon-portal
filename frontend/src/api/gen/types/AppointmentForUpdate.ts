export type AppointmentForUpdate = {
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
   * @type string, date-time
   */
  start?: string | null;
  /**
   * @type string
   */
  title?: string | null;
};
