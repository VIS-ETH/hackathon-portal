import type { AffectedRowsDto } from "./AffectedRowsDto";
import type { InviteUsersDto } from "./InviteUsersDto";
import type { PublicError } from "./PublicError";

export type InviteUsersPathParams = {
  /**
   * @type string, uuid
   */
  event_id: string;
};
export type InviteUsers200 = AffectedRowsDto;
export type InviteUsers500 = PublicError;
export type InviteUsersMutationRequest = InviteUsersDto;
export type InviteUsersMutationResponse = AffectedRowsDto;
export type InviteUsersMutation = {
  Response: InviteUsersMutationResponse;
  Request: InviteUsersMutationRequest;
  PathParams: InviteUsersPathParams;
  Errors: InviteUsers500;
};
