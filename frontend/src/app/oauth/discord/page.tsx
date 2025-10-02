"use client";

import { useGetEvent, usePostEventDiscordOauth } from "@/api/gen";

import { useEffect, useState } from "react";

import {
  Alert,
  Anchor,
  Center,
  Loader,
  Stack,
  Text,
  Title,
} from "@mantine/core";

import { useRouter, useSearchParams } from "next/navigation";

const DiscordOauth = () => {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );

  const router = useRouter();
  const params = useSearchParams();

  const eventId = params.get("state");
  const code = params.get("code");

  const { data: event } = useGetEvent(eventId ?? "", {
    query: { enabled: !!eventId },
  });

  const homeHref = event ? `/events/${event.slug}` : `/`;

  const connectDiscordMutation = usePostEventDiscordOauth();

  const connectDiscord = async () => {
    if (!eventId || !code) {
      throw new Error("Missing event ID or code");
    }

    await connectDiscordMutation.mutateAsync({
      eventId,
      data: {
        code: code,
        redirect_uri: `${window.location.origin}${window.location.pathname}`,
      },
    });
  };

  useEffect(() => {
    connectDiscord()
      .then(() => {
        setStatus("success");
        setTimeout(() => {
          router.push(homeHref);
        }, 3000);
      })
      .catch(() => setStatus("error"));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Center mih="60vh">
      <Stack align="center" gap="xl" maw={400}>
        <Title order={2}>Discord Login</Title>
        {status === "loading" && (
          <>
            <Loader size="xl" />
            <Text size="lg" ta="center">
              Hang on for a sec, linking your Discord account...
            </Text>
          </>
        )}
        {status === "success" && (
          <Alert radius="md" color="green" title="Success">
            <Text>
              Your Discord account has been successfully linked! Redirecting you
              back to the portal...
            </Text>
          </Alert>
        )}
        {status === "error" && (
          <Alert radius="md" color="red" title="Error">
            <Text>
              Authorization with Discord failed. Please try again later or
              contact support if the problem persists. Back{" "}
              <Anchor underline="hover" href={homeHref}>
                home
              </Anchor>
              .
            </Text>
          </Alert>
        )}
      </Stack>
    </Center>
  );
};

export default DiscordOauth;
