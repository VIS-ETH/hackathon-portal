import type { Appointment } from "./Appointment";
import type { AppointmentForUpdate } from "./AppointmentForUpdate";
import type { PublicError } from "./PublicError";

export type UpdateAppointmentPathParams = {
  /**
   * @type string, uuid
   */
  appointment_id: string;
};
export type UpdateAppointment200 = Appointment;
export type UpdateAppointment500 = PublicError;
export type UpdateAppointmentMutationRequest = AppointmentForUpdate;
export type UpdateAppointmentMutationResponse = Appointment;
export type UpdateAppointmentMutation = {
  Response: UpdateAppointmentMutationResponse;
  Request: UpdateAppointmentMutationRequest;
  PathParams: UpdateAppointmentPathParams;
  Errors: UpdateAppointment500;
};
