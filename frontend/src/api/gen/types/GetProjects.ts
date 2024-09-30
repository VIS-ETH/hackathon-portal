import type { Project } from "./Project";
import type { PublicError } from "./PublicError";

export type GetProjectsQueryParams = {
  /**
   * @description Filter by event id
   * @type string, uuid
   */
  event_id: string;
};
export type GetProjects200 = Project[];
export type GetProjects500 = PublicError;
export type GetProjectsQueryResponse = Project[];
export type GetProjectsQuery = {
  Response: GetProjectsQueryResponse;
  QueryParams: GetProjectsQueryParams;
  Errors: GetProjects500;
};
