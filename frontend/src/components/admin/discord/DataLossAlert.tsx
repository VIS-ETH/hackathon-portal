import { alertProps, largeIconProps } from "@/styles/common";

import { Alert, Text } from "@mantine/core";

import { IconAlertCircle } from "@tabler/icons-react";

const DataLossAlert = () => (
  <Alert
    {...alertProps}
    icon={<IconAlertCircle {...largeIconProps} />}
    color="red"
    title="Risk of data loss"
  >
    <Text>
      Due to a technical limitation,{" "}
      <strong>channels are identified by their names</strong>, so renaming in
      the configuration will create a new item and <strong>remove</strong> the
      old one from the server. If a channel rename is needed without loss of
      history, the rename must be manually done on the server, changed manually
      afterwards here and outside of the syncing period! Check the logs to
      ensure sync is done.{" "}
      <strong>Renaming a team in the Teams tab is supported</strong> (uses
      indexes to identify teams).
    </Text>
  </Alert>
);

export default DataLossAlert;
