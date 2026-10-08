import { PublicError } from "@/api/gen/schemas";

import { useEffect } from "react";

import { Notification } from "@mantine/core";

import axios from "axios";

type ErrorNotificationProps = {
  id: string;
  error: Error;
  onClose: (id: string) => void;
};

const ErrorNotification = ({ id, error, onClose }: ErrorNotificationProps) => {
  const getErrorMessage = (error: Error) => {
    if (axios.isAxiosError<PublicError>(error) && error.response) {
      return error.response.data?.message ?? error.message;
    }

    return error.message;
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [id, onClose]);

  return (
    <Notification
      title="An error occurred"
      mt="xs"
      color="red"
      radius="md"
      withBorder
      onClose={() => onClose(id)}
    >
      {getErrorMessage(error)}
    </Notification>
  );
};

export default ErrorNotification;
