import { PublicError } from "@/api/gen/schemas";

import { useEffect } from "react";

import { Notification } from "@mantine/core";

import axios from "axios";

type ErrorNotificationProps = {
  error: Error;
  onClose: () => void;
};

const ErrorNotification = ({ error, onClose }: ErrorNotificationProps) => {
  const getErrorMessage = (error: Error) => {
    if (axios.isAxiosError<PublicError>(error) && error.response) {
      return error.response.data.message;
    }

    return error.message;
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <Notification
      title="An error occurred"
      mt="xs"
      color="red"
      radius="md"
      withBorder
      onClose={onClose}
    >
      {getErrorMessage(error)}
    </Notification>
  );
};

export default ErrorNotification;
