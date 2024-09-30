import type { Appointment } from "./Appointment";
import type { PublicError } from "./PublicError";

export type DeleteAppointmentPathParams = {
  /**
   * @type string, uuid
   */
  appointment_id: string;
};
export type DeleteAppointment200 = Appointment;
export type DeleteAppointment500 = PublicError;
export type DeleteAppointmentMutationResponse = Appointment;
export type DeleteAppointmentMutation = {
  Response: DeleteAppointmentMutationResponse;
  PathParams: DeleteAppointmentPathParams;
  Errors: DeleteAppointment500;
};
