import type { EventRole } from "./EventRole";
import type { PublicError } from "./PublicError";

export type GetEventsRoles200 = {
  [key: string]: EventRole[];
};
export type GetEventsRoles500 = PublicError;
export type GetEventsRolesQueryResponse = {
  [key: string]: EventRole[];
};
export type GetEventsRolesQuery = {
  Response: GetEventsRolesQueryResponse;
  Errors: GetEventsRoles500;
};
