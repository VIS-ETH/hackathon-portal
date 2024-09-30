import type { Project } from "./Project";
import type { ProjectForCreate } from "./ProjectForCreate";
import type { PublicError } from "./PublicError";

export type CreateProject200 = Project;
export type CreateProject500 = PublicError;
export type CreateProjectMutationRequest = ProjectForCreate;
export type CreateProjectMutationResponse = Project;
export type CreateProjectMutation = {
  Response: CreateProjectMutationResponse;
  Request: CreateProjectMutationRequest;
  Errors: CreateProject500;
};
