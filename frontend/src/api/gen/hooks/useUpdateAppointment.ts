import type {
  UpdateAppointment500,
  UpdateAppointmentMutationRequest,
  UpdateAppointmentMutationResponse,
  UpdateAppointmentPathParams,
} from "../types/UpdateAppointment";

import client from "@/api/client";

import { useMutation } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";

type UpdateAppointmentClient = typeof client<
  UpdateAppointmentMutationResponse,
  UpdateAppointment500,
  UpdateAppointmentMutationRequest
>;
type UpdateAppointment = {
  data: UpdateAppointmentMutationResponse;
  error: UpdateAppointment500;
  request: UpdateAppointmentMutationRequest;
  pathParams: UpdateAppointmentPathParams;
  queryParams: never;
  headerParams: never;
  response: UpdateAppointmentMutationResponse;
  client: {
    parameters: Partial<Parameters<UpdateAppointmentClient>[0]>;
    return: Awaited<ReturnType<UpdateAppointmentClient>>;
  };
};
/**
 * @link /api/appointments/:appointment_id
 */
export function useUpdateAppointment(
  appointmentId: UpdateAppointmentPathParams["appointment_id"],
  options: {
    mutation?: UseMutationOptions<
      UpdateAppointment["response"],
      UpdateAppointment["error"],
      UpdateAppointment["request"]
    >;
    client?: UpdateAppointment["client"]["parameters"];
  } = {},
) {
  const { mutation: mutationOptions, client: clientOptions = {} } =
    options ?? {};
  return useMutation({
    mutationFn: async (data) => {
      const res = await client<
        UpdateAppointment["data"],
        UpdateAppointment["error"],
        UpdateAppointment["request"]
      >({
        method: "patch",
        url: `/api/appointments/${appointmentId}`,
        data,
        ...clientOptions,
      });
      return res;
    },
    ...mutationOptions,
  });
}
