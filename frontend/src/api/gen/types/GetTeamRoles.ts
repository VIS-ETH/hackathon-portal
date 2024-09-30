import type { PublicError } from "./PublicError";
import type { TeamRole } from "./TeamRole";

export type GetTeamRolesPathParams = {
  /**
   * @type string, uuid
   */
  team_id: string;
};
export type GetTeamRoles200 = TeamRole[];
export type GetTeamRoles500 = PublicError;
export type GetTeamRolesQueryResponse = TeamRole[];
export type GetTeamRolesQuery = {
  Response: GetTeamRolesQueryResponse;
  PathParams: GetTeamRolesPathParams;
  Errors: GetTeamRoles500;
};
