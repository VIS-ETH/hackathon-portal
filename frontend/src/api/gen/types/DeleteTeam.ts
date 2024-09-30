import type { PublicError } from "./PublicError";
import type { Team } from "./Team";

export type DeleteTeamPathParams = {
  /**
   * @type string, uuid
   */
  team_id: string;
};
export type DeleteTeam200 = Team;
export type DeleteTeam500 = PublicError;
export type DeleteTeamMutationResponse = Team;
export type DeleteTeamMutation = {
  Response: DeleteTeamMutationResponse;
  PathParams: DeleteTeamPathParams;
  Errors: DeleteTeam500;
};
