import type { CreateSidequestDto } from "./CreateSidequestDto";
import type { PublicError } from "./PublicError";

export type PostSidequests200 = number;
export type PostSidequests500 = PublicError;
export type PostSidequestsMutationRequest = CreateSidequestDto;
export type PostSidequestsMutationResponse = number;
export type PostSidequestsMutation = {
  Response: PostSidequestsMutationResponse;
  Request: PostSidequestsMutationRequest;
  Errors: PostSidequests500;
};
