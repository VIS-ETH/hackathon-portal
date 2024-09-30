import type { PublicError } from "./PublicError";
import type { Team } from "./Team";

export type GetTeamBySlugPathParams = {
  /**
   * @type string
   */
  event_slug: string;
  /**
   * @type string
   */
  team_slug: string;
};
export type GetTeamBySlug200 = Team;
export type GetTeamBySlug500 = PublicError;
export type GetTeamBySlugQueryResponse = Team;
export type GetTeamBySlugQuery = {
  Response: GetTeamBySlugQueryResponse;
  PathParams: GetTeamBySlugPathParams;
  Errors: GetTeamBySlug500;
};
