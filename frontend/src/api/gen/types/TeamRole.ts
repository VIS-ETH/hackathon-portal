export const teamRole = {
  Member: "Member",
  Mentor: "Mentor",
} as const;
export type TeamRole = (typeof teamRole)[keyof typeof teamRole];
