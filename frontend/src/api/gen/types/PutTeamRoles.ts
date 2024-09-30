import type { AffectedRowsDto } from "./AffectedRowsDto";
import type { PublicError } from "./PublicError";
import type { TeamRole } from "./TeamRole";

export type PutTeamRolesPathParams = {
  /**
   * @type string, uuid
   */
  team_id: string;
};
export type PutTeamRoles200 = AffectedRowsDto;
export type PutTeamRoles500 = PublicError;
export type PutTeamRolesMutationRequest = {
  [key: string]: TeamRole[];
};
export type PutTeamRolesMutationResponse = AffectedRowsDto;
export type PutTeamRolesMutation = {
  Response: PutTeamRolesMutationResponse;
  Request: PutTeamRolesMutationRequest;
  PathParams: PutTeamRolesPathParams;
  Errors: PutTeamRoles500;
};
