import type { Project } from "./Project";
import type { ProjectForUpdate } from "./ProjectForUpdate";
import type { PublicError } from "./PublicError";

export type UpdateProjectPathParams = {
  /**
   * @type string, uuid
   */
  project_id: string;
};
export type UpdateProject200 = Project;
export type UpdateProject500 = PublicError;
export type UpdateProjectMutationRequest = ProjectForUpdate;
export type UpdateProjectMutationResponse = Project;
export type UpdateProjectMutation = {
  Response: UpdateProjectMutationResponse;
  Request: UpdateProjectMutationRequest;
  PathParams: UpdateProjectPathParams;
  Errors: UpdateProject500;
};
