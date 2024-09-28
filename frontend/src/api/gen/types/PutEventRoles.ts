import type { AffectedRowsDto } from "./AffectedRowsDto";
import type { EventRole } from "./EventRole";
import type { PublicError } from "./PublicError";

export type PutEventRolesPathParams = {
  /**
   * @type string, uuid
   */
  event_id: string;
};
export type PutEventRoles200 = AffectedRowsDto;
export type PutEventRoles500 = PublicError;
export type PutEventRolesMutationRequest = {
  [key: string]: EventRole[];
};
export type PutEventRolesMutationResponse = AffectedRowsDto;
export type PutEventRolesMutation = {
  Response: PutEventRolesMutationResponse;
  Request: PutEventRolesMutationRequest;
  PathParams: PutEventRolesPathParams;
  Errors: PutEventRoles500;
};
