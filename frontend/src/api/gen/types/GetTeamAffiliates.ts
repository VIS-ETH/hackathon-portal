import type { PublicError } from "./PublicError";
import type { TeamAffiliate } from "./TeamAffiliate";
import type { TeamRole } from "./TeamRole";

export type GetTeamAffiliatesPathParams = {
  /**
   * @type string, uuid
   */
  team_id: string;
};
export type GetTeamAffiliatesQueryParams = {
  /**
   * @description Filter by team role
   */
  role?: TeamRole | null;
};
export type GetTeamAffiliates200 = TeamAffiliate[];
export type GetTeamAffiliates500 = PublicError;
export type GetTeamAffiliatesQueryResponse = TeamAffiliate[];
export type GetTeamAffiliatesQuery = {
  Response: GetTeamAffiliatesQueryResponse;
  PathParams: GetTeamAffiliatesPathParams;
  QueryParams: GetTeamAffiliatesQueryParams;
  Errors: GetTeamAffiliates500;
};
