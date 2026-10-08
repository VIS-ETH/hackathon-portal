import { useDiscord } from "@/hooks/useDiscord";
import { alertProps, largeIconProps } from "@/styles/common";

import { Alert, Anchor, Text } from "@mantine/core";

import { IconAlertCircle } from "@tabler/icons-react";

const DiscordBanner = () => {
  const { showBanner, dismissBanner, discordAuthUrl } = useDiscord();

  return (
    showBanner && (
      <Alert
        {...alertProps}
        icon={<IconAlertCircle {...largeIconProps} />}
        color="yellow"
        mb="lg"
        withCloseButton
        onClose={dismissBanner}
        title="Please connect your Discord account"
      >
        <Text>
          <Anchor underline="always" href={discordAuthUrl}>
            Click here
          </Anchor>{" "}
          to connect your Discord account to get access to the event server and
          team chats.
        </Text>
      </Alert>
    )
  );
};

export default DiscordBanner;
