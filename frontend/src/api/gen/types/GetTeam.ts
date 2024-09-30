import type { PublicError } from "./PublicError";
import type { Team } from "./Team";

export type GetTeamPathParams = {
  /**
   * @type string, uuid
   */
  team_id: string;
};
export type GetTeam200 = Team;
export type GetTeam500 = PublicError;
export type GetTeamQueryResponse = Team;
export type GetTeamQuery = {
  Response: GetTeamQueryResponse;
  PathParams: GetTeamPathParams;
  Errors: GetTeam500;
};
