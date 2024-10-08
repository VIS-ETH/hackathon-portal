"use client";

import { ErrorContext } from "./ErrorContext";

import { useContext } from "react";

import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

let browserQueryClient: QueryClient | undefined = undefined;

const getQueryClient = (setError: (id: string, error: Error) => void) => {
  if (!browserQueryClient) {
    browserQueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000,
        },
      },
      queryCache: new QueryCache({
        onError(error, query) {
          setError(query.queryHash, error);
        },
      }),
      mutationCache: new MutationCache({
        onError(error, variables, context, mutation) {
          setError(mutation.mutationId.toString(), error);
        },
      }),
    });
  }

  return browserQueryClient;
};

const QueryProvider = ({
  children,
}: Readonly<{ children: React.ReactNode }>) => {
  const { setError } = useContext(ErrorContext);

  const queryClient = getQueryClient(setError);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

export default QueryProvider;
