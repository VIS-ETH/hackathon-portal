export const eventVisibility = {
  Private: "Private",
  Public: "Public",
  Restricted: "Restricted",
} as const;
export type EventVisibility =
  (typeof eventVisibility)[keyof typeof eventVisibility];
