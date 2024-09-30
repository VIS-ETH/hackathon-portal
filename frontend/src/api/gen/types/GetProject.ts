import type { Project } from "./Project";
import type { PublicError } from "./PublicError";

export type GetProjectPathParams = {
  /**
   * @type string, uuid
   */
  project_id: string;
};
export type GetProject200 = Project;
export type GetProject500 = PublicError;
export type GetProjectQueryResponse = Project;
export type GetProjectQuery = {
  Response: GetProjectQueryResponse;
  PathParams: GetProjectPathParams;
  Errors: GetProject500;
};
