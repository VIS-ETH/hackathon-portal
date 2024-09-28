import type { EventPhase } from "./EventPhase";
import type { EventVisibility } from "./EventVisibility";

export type EventForPatch = {
  /**
   * @type string, date-time
   */
  end?: string | null;
  /**
   * @type boolean
   */
  is_feedback_visible?: boolean | null;
  /**
   * @type integer, int32
   */
  max_team_size?: number | null;
  /**
   * @type string
   */
  name?: string | null;
  phase?: EventPhase | null;
  /**
   * @type string, date-time
   */
  start?: string | null;
  visibility?: EventVisibility | null;
};
