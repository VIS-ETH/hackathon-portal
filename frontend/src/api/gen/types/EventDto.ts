import type { EventPhase } from "./EventPhase";
import type { EventVisibility } from "./EventVisibility";

export type EventDto = {
  /**
   * @type string, date-time
   */
  end: string;
  /**
   * @type string, uuid
   */
  id: string;
  /**
   * @type boolean
   */
  is_feedback_visible: boolean;
  /**
   * @type integer, int32
   */
  max_team_size: number;
  /**
   * @type string
   */
  name: string;
  phase: EventPhase;
  /**
   * @type string
   */
  slug: string;
  /**
   * @type string, date-time
   */
  start: string;
  visibility: EventVisibility;
};
