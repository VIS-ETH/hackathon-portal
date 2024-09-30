import type { ProjectPreferences } from "./ProjectPreferences";
import type { PublicError } from "./PublicError";

export type GetTeamProjectPreferencesPathParams = {
  /**
   * @type string, uuid
   */
  team_id: string;
};
export type GetTeamProjectPreferences200 = ProjectPreferences;
export type GetTeamProjectPreferences500 = PublicError;
export type GetTeamProjectPreferencesQueryResponse = ProjectPreferences;
export type GetTeamProjectPreferencesQuery = {
  Response: GetTeamProjectPreferencesQueryResponse;
  PathParams: GetTeamProjectPreferencesPathParams;
  Errors: GetTeamProjectPreferences500;
};
