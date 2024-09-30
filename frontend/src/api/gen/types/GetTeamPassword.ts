import type { PublicError } from "./PublicError";
import type { TeamPasswordDto } from "./TeamPasswordDto";

export type GetTeamPasswordPathParams = {
  /**
   * @type string, uuid
   */
  team_id: string;
};
export type GetTeamPassword200 = TeamPasswordDto;
export type GetTeamPassword500 = PublicError;
export type GetTeamPasswordQueryResponse = TeamPasswordDto;
export type GetTeamPasswordQuery = {
  Response: GetTeamPasswordQueryResponse;
  PathParams: GetTeamPasswordPathParams;
  Errors: GetTeamPassword500;
};
