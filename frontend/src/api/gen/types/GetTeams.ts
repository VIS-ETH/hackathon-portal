import type { PublicError } from "./PublicError";
import type { Team } from "./Team";

export type GetTeamsQueryParams = {
  /**
   * @description Filter by event id
   * @type string, uuid
   */
  event_id: string;
};
export type GetTeams200 = Team[];
export type GetTeams500 = PublicError;
export type GetTeamsQueryResponse = Team[];
export type GetTeamsQuery = {
  Response: GetTeamsQueryResponse;
  QueryParams: GetTeamsQueryParams;
  Errors: GetTeams500;
};
