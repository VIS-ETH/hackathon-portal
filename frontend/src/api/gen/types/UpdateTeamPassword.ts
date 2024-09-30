import type { PublicError } from "./PublicError";
import type { Team } from "./Team";
import type { TeamPasswordDto } from "./TeamPasswordDto";

export type UpdateTeamPasswordPathParams = {
  /**
   * @type string, uuid
   */
  team_id: string;
};
export type UpdateTeamPassword200 = Team;
export type UpdateTeamPassword500 = PublicError;
export type UpdateTeamPasswordMutationRequest = TeamPasswordDto;
export type UpdateTeamPasswordMutationResponse = Team;
export type UpdateTeamPasswordMutation = {
  Response: UpdateTeamPasswordMutationResponse;
  Request: UpdateTeamPasswordMutationRequest;
  PathParams: UpdateTeamPasswordPathParams;
  Errors: UpdateTeamPassword500;
};
