import type {
  CreateAppointment500,
  CreateAppointmentMutationRequest,
  CreateAppointmentMutationResponse,
} from "../types/CreateAppointment";

import client from "@/api/client";

import { useMutation } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";

type CreateAppointmentClient = typeof client<
  CreateAppointmentMutationResponse,
  CreateAppointment500,
  CreateAppointmentMutationRequest
>;
type CreateAppointment = {
  data: CreateAppointmentMutationResponse;
  error: CreateAppointment500;
  request: CreateAppointmentMutationRequest;
  pathParams: never;
  queryParams: never;
  headerParams: never;
  response: CreateAppointmentMutationResponse;
  client: {
    parameters: Partial<Parameters<CreateAppointmentClient>[0]>;
    return: Awaited<ReturnType<CreateAppointmentClient>>;
  };
};
/**
 * @link /api/appointments
 */
export function useCreateAppointment(
  options: {
    mutation?: UseMutationOptions<
      CreateAppointment["response"],
      CreateAppointment["error"],
      CreateAppointment["request"]
    >;
    client?: CreateAppointment["client"]["parameters"];
  } = {},
) {
  const { mutation: mutationOptions, client: clientOptions = {} } =
    options ?? {};
  return useMutation({
    mutationFn: async (data) => {
      const res = await client<
        CreateAppointment["data"],
        CreateAppointment["error"],
        CreateAppointment["request"]
      >({
        method: "post",
        url: `/api/appointments`,
        data,
        ...clientOptions,
      });
      return res;
    },
    ...mutationOptions,
  });
}
