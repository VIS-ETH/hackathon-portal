import type { AffectedRowsDto } from "./AffectedRowsDto";
import type { EventRole } from "./EventRole";
import type { PublicError } from "./PublicError";

export type DeleteEventRolesPathParams = {
  /**
   * @type string, uuid
   */
  event_id: string;
};
export type DeleteEventRoles200 = AffectedRowsDto;
export type DeleteEventRoles500 = PublicError;
export type DeleteEventRolesMutationRequest = {
  [key: string]: EventRole[];
};
export type DeleteEventRolesMutationResponse = AffectedRowsDto;
export type DeleteEventRolesMutation = {
  Response: DeleteEventRolesMutationResponse;
  Request: DeleteEventRolesMutationRequest;
  PathParams: DeleteEventRolesPathParams;
  Errors: DeleteEventRoles500;
};
