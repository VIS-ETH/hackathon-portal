import type { Appointment } from "./Appointment";
import type { AppointmentForCreate } from "./AppointmentForCreate";
import type { PublicError } from "./PublicError";

export type CreateAppointment200 = Appointment;
export type CreateAppointment500 = PublicError;
export type CreateAppointmentMutationRequest = AppointmentForCreate;
export type CreateAppointmentMutationResponse = Appointment;
export type CreateAppointmentMutation = {
  Response: CreateAppointmentMutationResponse;
  Request: CreateAppointmentMutationRequest;
  Errors: CreateAppointment500;
};
