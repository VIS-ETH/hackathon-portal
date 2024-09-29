import type { EventRole } from "./EventRole";
import type { TeamRole } from "./TeamRole";

export type UserRoles = {
  /**
   * @type object
   */
  event: {
    [key: string]: EventRole[];
  };
  /**
   * @type object
   */
  team: {
    [key: string]: TeamRole[];
  };
};
