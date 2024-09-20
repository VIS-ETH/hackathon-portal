// adapted from https://kubb.dev/plugins/swagger-client/client
import axios from "axios";
import type { AxiosError, AxiosHeaders, AxiosRequestConfig } from "axios";

declare const AXIOS_BASE: string;
declare const AXIOS_HEADERS: string;

export type RequestConfig<TVariables = unknown> = {
  method: "get" | "put" | "patch" | "post" | "delete";
  url: string;
  params?: unknown;
  data?: TVariables;
  responseType?:
    | "arraybuffer"
    | "blob"
    | "document"
    | "json"
    | "text"
    | "stream";
  signal?: AbortSignal;
  headers?: AxiosRequestConfig["headers"];
};

export type ErrorResponse = {
  msg: string;
};

export const axiosInstance = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_URL ??
    (typeof AXIOS_BASE !== "undefined" ? AXIOS_BASE : undefined),
  headers:
    typeof AXIOS_HEADERS !== "undefined"
      ? (JSON.parse(AXIOS_HEADERS) as AxiosHeaders)
      : undefined,
});

export const axiosClient = async <
  TData,
  TError = unknown,
  TVariables = unknown,
>(
  config: RequestConfig<TVariables>,
): Promise<TData> => {
  const promise = axiosInstance
    .request<TData>({ ...config })
    .then(({ data }) => data)
    .catch((e: AxiosError<TError>) => {
      throw e;
    });

  return promise;
};

export default axiosClient;
