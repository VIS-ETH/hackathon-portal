import type { LoopStatus } from "./LoopStatus";

export type AggregatorStatus = {
  /**
   * @type string, uuid
   */
  event_id: string;
  status: LoopStatus;
};
