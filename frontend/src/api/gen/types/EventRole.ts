export const eventRole = {
  Admin: "Admin",
  Mentor: "Mentor",
  Participant: "Participant",
  SidequestMaster: "SidequestMaster",
  Stakeholder: "Stakeholder",
} as const;
export type EventRole = (typeof eventRole)[keyof typeof eventRole];
