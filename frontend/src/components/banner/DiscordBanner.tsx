import { useDiscord } from "@/hooks/useDiscord";
import { alertProps, largeIconProps } from "@/styles/common";

import { Alert, Anchor, Box, Text } from "@mantine/core";

import { IconAlertCircle } from "@tabler/icons-react";

const DiscordBanner = () => {
  const { showBanner, dismissBanner, discordAuthUrl } = useDiscord();

  return (
    showBanner && (
      <Box mb="lg" role="button" tabIndex={0} aria-label="Connect Discord">
        <Alert
          {...alertProps}
          icon={<IconAlertCircle {...largeIconProps} />}
          color="yellow"
          withCloseButton
          onClose={dismissBanner}
          title="Please connect your Discord account"
        >
          <Text>
            <Anchor underline="always" href={discordAuthUrl}>
              Click here
            </Anchor>{" "}
            to connect your Discord account to get access to the event server
            and team chats.
          </Text>
        </Alert>
      </Box>
    )
  );
};

export default DiscordBanner;
