export const eventPhase = {
  Grading: "Grading",
  Hacking: "Hacking",
  Readonly: "Readonly",
  Registration: "Registration",
} as const;
export type EventPhase = (typeof eventPhase)[keyof typeof eventPhase];
