import type { Appointment } from "./Appointment";
import type { PublicError } from "./PublicError";

export type GetAppointmentPathParams = {
  /**
   * @type string, uuid
   */
  appointment_id: string;
};
export type GetAppointment200 = Appointment;
export type GetAppointment500 = PublicError;
export type GetAppointmentQueryResponse = Appointment;
export type GetAppointmentQuery = {
  Response: GetAppointmentQueryResponse;
  PathParams: GetAppointmentPathParams;
  Errors: GetAppointment500;
};
