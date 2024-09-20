"use client";

import ErrorNotification from "@/componentes/ErrorNotification";

import { useState } from "react";

import { Affix } from "@mantine/core";

import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
  isServer,
} from "@tanstack/react-query";

let browserQueryClient: QueryClient | undefined = undefined;

function makeQueryClient(handleError: (id: string, error: Error) => void) {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
    },
    queryCache: new QueryCache({
      onError(error, query) {
        handleError(query.queryHash, error);
      },
    }),
    mutationCache: new MutationCache({
      onError(error, variables, context, mutation) {
        handleError(mutation.mutationId.toString(), error);
      },
    }),
  });
}

const getQueryClient = (handleError: (id: string, error: Error) => void) => {
  if (isServer) {
    return makeQueryClient(handleError);
  } else {
    if (!browserQueryClient) browserQueryClient = makeQueryClient(handleError);
    return browserQueryClient;
  }
};

const QueryProvider = ({
  children,
}: Readonly<{ children: React.ReactNode }>) => {
  const [errors, setErrors] = useState<Record<string, Error>>({});

  const handleError = (id: string, error: Error) => {
    setErrors((prev) => ({
      ...prev,
      [id]: error,
    }));
  };

  const closeError = (id: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const queryClient = getQueryClient(handleError);

  return (
    <>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      <Affix bottom={20} right={20} zIndex={1000}>
        {Object.entries(errors).map(([id, error]) => (
          <ErrorNotification
            key={id}
            error={error}
            onClose={() => closeError(id)}
          />
        ))}
      </Affix>
    </>
  );
};

export default QueryProvider;
