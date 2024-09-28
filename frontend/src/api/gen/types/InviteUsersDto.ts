import type { EventRole } from "./EventRole";
import type { UserForCreate } from "./UserForCreate";

export type InviteUsersDto = {
  /**
   * @type array
   */
  default_roles: EventRole[];
  /**
   * @type array
   */
  users: UserForCreate[];
};
