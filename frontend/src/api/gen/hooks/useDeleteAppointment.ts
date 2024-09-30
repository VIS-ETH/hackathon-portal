import type {
  DeleteAppointment500,
  DeleteAppointmentMutationResponse,
  DeleteAppointmentPathParams,
} from "../types/DeleteAppointment";

import client from "@/api/client";

import { useMutation } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";

type DeleteAppointmentClient = typeof client<
  DeleteAppointmentMutationResponse,
  DeleteAppointment500,
  never
>;
type DeleteAppointment = {
  data: DeleteAppointmentMutationResponse;
  error: DeleteAppointment500;
  request: never;
  pathParams: DeleteAppointmentPathParams;
  queryParams: never;
  headerParams: never;
  response: DeleteAppointmentMutationResponse;
  client: {
    parameters: Partial<Parameters<DeleteAppointmentClient>[0]>;
    return: Awaited<ReturnType<DeleteAppointmentClient>>;
  };
};
/**
 * @link /api/appointments/:appointment_id
 */
export function useDeleteAppointment(
  appointmentId: DeleteAppointmentPathParams["appointment_id"],
  options: {
    mutation?: UseMutationOptions<
      DeleteAppointment["response"],
      DeleteAppointment["error"],
      DeleteAppointment["request"]
    >;
    client?: DeleteAppointment["client"]["parameters"];
  } = {},
) {
  const { mutation: mutationOptions, client: clientOptions = {} } =
    options ?? {};
  return useMutation({
    mutationFn: async () => {
      const res = await client<
        DeleteAppointment["data"],
        DeleteAppointment["error"],
        DeleteAppointment["request"]
      >({
        method: "delete",
        url: `/api/appointments/${appointmentId}`,
        ...clientOptions,
      });
      return res;
    },
    ...mutationOptions,
  });
}
