export const aggregationAction = {
  Start: "Start",
  Stop: "Stop",
} as const;
export type AggregationAction =
  (typeof aggregationAction)[keyof typeof aggregationAction];
