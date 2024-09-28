import type { EventRolesMap } from "./EventRolesMap";
import type { TeamRolesMap } from "./TeamRolesMap";

export type UserRoles = {
  event: EventRolesMap;
  team: TeamRolesMap;
};
