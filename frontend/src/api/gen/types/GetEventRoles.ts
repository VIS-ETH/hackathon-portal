import type { EventRole } from "./EventRole";
import type { PublicError } from "./PublicError";

export type GetEventRolesPathParams = {
  /**
   * @type string, uuid
   */
  event_id: string;
};
export type GetEventRoles200 = EventRole[];
export type GetEventRoles500 = PublicError;
export type GetEventRolesQueryResponse = EventRole[];
export type GetEventRolesQuery = {
  Response: GetEventRolesQueryResponse;
  PathParams: GetEventRolesPathParams;
  Errors: GetEventRoles500;
};
