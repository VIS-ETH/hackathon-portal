export const eventPhase = {
  Grading: "Grading",
  Hacking: "Hacking",
  Registration: "Registration",
  Finished: "Finished",
} as const;
export type EventPhase = (typeof eventPhase)[keyof typeof eventPhase];
