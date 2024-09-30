import type { ProjectPreferences } from "./ProjectPreferences";
import type { PublicError } from "./PublicError";

export type UpdateTeamProjectPreferencesPathParams = {
  /**
   * @type string, uuid
   */
  team_id: string;
};
export type UpdateTeamProjectPreferences200 = ProjectPreferences;
export type UpdateTeamProjectPreferences500 = PublicError;
export type UpdateTeamProjectPreferencesMutationRequest = ProjectPreferences;
export type UpdateTeamProjectPreferencesMutationResponse = ProjectPreferences;
export type UpdateTeamProjectPreferencesMutation = {
  Response: UpdateTeamProjectPreferencesMutationResponse;
  Request: UpdateTeamProjectPreferencesMutationRequest;
  PathParams: UpdateTeamProjectPreferencesPathParams;
  Errors: UpdateTeamProjectPreferences500;
};
