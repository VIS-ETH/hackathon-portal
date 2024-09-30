import type { TeamRole } from "./TeamRole";

export type TeamAffiliate = {
  /**
   * @type string, uuid
   */
  id: string;
  /**
   * @type string
   */
  name: string;
  /**
   * @type array
   */
  roles: TeamRole[];
};
