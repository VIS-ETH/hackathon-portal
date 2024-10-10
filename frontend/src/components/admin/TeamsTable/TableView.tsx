export type TableView = (typeof TableView)[keyof typeof TableView];

export const TableView = {
  General: "General",
  Projects: "Projects",
  Password: "Password",
  Members: "Members",
  Mentors: "Mentors",
  Comments: "Comments",
} as const;
