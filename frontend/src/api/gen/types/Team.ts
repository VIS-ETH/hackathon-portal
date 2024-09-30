export type Team = {
  /**
   * @type string, uuid
   */
  event_id: string;
  /**
   * @type string, uuid
   */
  id: string;
  /**
   * @type integer, int32
   */
  index: number;
  /**
   * @type string
   */
  name: string;
  /**
   * @type string, uuid
   */
  project_id?: string | null;
  /**
   * @type string
   */
  slug: string;
};
