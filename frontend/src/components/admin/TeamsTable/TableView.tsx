export type TableView = (typeof TableView)[keyof typeof TableView];

export const TableView = {
  General: "General",
  Projects: "Projects",
  Infra: "Infrastructure",
  Members: "Members",
  Mentors: "Mentors",
  Stakeholders: "Stakeholders",
  Notes: "Notes",
} as const;
