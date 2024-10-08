import ErrorNotification from "./ErrorNotification";

import { ErrorContext } from "@/contexts/ErrorContext";

import { useContext } from "react";

import { Affix } from "@mantine/core";

const ErrorNotificationsAffix = () => {
  const { errors, closeError } = useContext(ErrorContext);

  return (
    <Affix bottom={20} right={20} zIndex={1000}>
      {errors.map(([id, error]) => (
        <ErrorNotification
          key={id}
          error={error}
          onClose={() => closeError(id)}
        />
      ))}
    </Affix>
  );
};

export default ErrorNotificationsAffix;
