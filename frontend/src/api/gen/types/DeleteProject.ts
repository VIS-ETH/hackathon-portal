import type { Project } from "./Project";
import type { PublicError } from "./PublicError";

export type DeleteProjectPathParams = {
  /**
   * @type string, uuid
   */
  project_id: string;
};
export type DeleteProject200 = Project;
export type DeleteProject500 = PublicError;
export type DeleteProjectMutationResponse = Project;
export type DeleteProjectMutation = {
  Response: DeleteProjectMutationResponse;
  PathParams: DeleteProjectPathParams;
  Errors: DeleteProject500;
};
