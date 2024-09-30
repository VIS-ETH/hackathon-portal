import type { Appointment } from "./Appointment";
import type { PublicError } from "./PublicError";

export type GetAppointmentsQueryParams = {
  /**
   * @description Filter by event id
   * @type string, uuid
   */
  event_id: string;
};
export type GetAppointments200 = Appointment[];
export type GetAppointments500 = PublicError;
export type GetAppointmentsQueryResponse = Appointment[];
export type GetAppointmentsQuery = {
  Response: GetAppointmentsQueryResponse;
  QueryParams: GetAppointmentsQueryParams;
  Errors: GetAppointments500;
};
