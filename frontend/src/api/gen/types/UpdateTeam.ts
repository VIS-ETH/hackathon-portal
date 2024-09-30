import type { Appointment } from "./Appointment";
import type { PublicError } from "./PublicError";
import type { TeamForUpdate } from "./TeamForUpdate";

export type UpdateTeamPathParams = {
  /**
   * @type string, uuid
   */
  team_id: string;
};
export type UpdateTeam200 = Appointment;
export type UpdateTeam500 = PublicError;
export type UpdateTeamMutationRequest = TeamForUpdate;
export type UpdateTeamMutationResponse = Appointment;
export type UpdateTeamMutation = {
  Response: UpdateTeamMutationResponse;
  Request: UpdateTeamMutationRequest;
  PathParams: UpdateTeamPathParams;
  Errors: UpdateTeam500;
};
