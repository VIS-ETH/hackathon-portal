import type { PublicError } from "./PublicError";
import type { Team } from "./Team";
import type { TeamProjectDto } from "./TeamProjectDto";

export type UpdateTeamProjectPathParams = {
  /**
   * @type string, uuid
   */
  team_id: string;
};
export type UpdateTeamProject200 = Team;
export type UpdateTeamProject500 = PublicError;
export type UpdateTeamProjectMutationRequest = TeamProjectDto;
export type UpdateTeamProjectMutationResponse = Team;
export type UpdateTeamProjectMutation = {
  Response: UpdateTeamProjectMutationResponse;
  Request: UpdateTeamProjectMutationRequest;
  PathParams: UpdateTeamProjectPathParams;
  Errors: UpdateTeamProject500;
};
