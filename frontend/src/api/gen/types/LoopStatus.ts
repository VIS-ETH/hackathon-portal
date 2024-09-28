export const loopStatus = {
  NonExisting: "NonExisting",
  Running: "Running",
  Exited: "Exited",
} as const;
export type LoopStatus = (typeof loopStatus)[keyof typeof loopStatus];
