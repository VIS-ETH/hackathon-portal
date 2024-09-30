import type { Project } from "./Project";
import type { PublicError } from "./PublicError";

export type GetProjectBySlugPathParams = {
  /**
   * @type string
   */
  event_slug: string;
  /**
   * @type string
   */
  project_slug: string;
};
export type GetProjectBySlug200 = Project;
export type GetProjectBySlug500 = PublicError;
export type GetProjectBySlugQueryResponse = Project;
export type GetProjectBySlugQuery = {
  Response: GetProjectBySlugQueryResponse;
  PathParams: GetProjectBySlugPathParams;
  Errors: GetProjectBySlug500;
};
