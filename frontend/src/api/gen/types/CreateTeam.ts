import type { PublicError } from "./PublicError";
import type { Team } from "./Team";
import type { TeamForCreate } from "./TeamForCreate";

export type CreateTeam200 = Team;
export type CreateTeam500 = PublicError;
export type CreateTeamMutationRequest = TeamForCreate;
export type CreateTeamMutationResponse = Team;
export type CreateTeamMutation = {
  Response: CreateTeamMutationResponse;
  Request: CreateTeamMutationRequest;
  Errors: CreateTeam500;
};
