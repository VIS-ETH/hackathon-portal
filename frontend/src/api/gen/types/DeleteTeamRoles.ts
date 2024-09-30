import type { AffectedRowsDto } from "./AffectedRowsDto";
import type { PublicError } from "./PublicError";
import type { TeamRole } from "./TeamRole";

export type DeleteTeamRolesPathParams = {
  /**
   * @type string, uuid
   */
  team_id: string;
};
export type DeleteTeamRoles200 = AffectedRowsDto;
export type DeleteTeamRoles500 = PublicError;
export type DeleteTeamRolesMutationRequest = {
  [key: string]: TeamRole[];
};
export type DeleteTeamRolesMutationResponse = AffectedRowsDto;
export type DeleteTeamRolesMutation = {
  Response: DeleteTeamRolesMutationResponse;
  Request: DeleteTeamRolesMutationRequest;
  PathParams: DeleteTeamRolesPathParams;
  Errors: DeleteTeamRoles500;
};
