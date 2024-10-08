import { createContext, useState } from "react";

import { produce } from "immer";

export type ErrorContextType = {
  errors: [string, Error][];
  setError: (id: string, error: Error) => void;
  closeError: (id: string) => void;
};

export const ErrorContext = createContext<ErrorContextType>({
  errors: [],
  setError: () => {},
  closeError: () => {},
});

export const ErrorContextProvider = ({
  children,
}: Readonly<{ children: React.ReactNode }>) => {
  const [errors, setErrors] = useState<ErrorContextType["errors"]>([]);

  const setError = (id: string, error: Error) => {
    setErrors((prev) =>
      produce(prev, (draft) => {
        draft.push([id, error]);
      }),
    );
  };

  const closeError = (id: string) => {
    setErrors((prev) => prev.filter(([key]) => key !== id));
  };

  return (
    <ErrorContext.Provider value={{ errors, setError, closeError }}>
      {children}
    </ErrorContext.Provider>
  );
};
