import { useResolveParams } from "./useResolveParams";

import { useGetEventDiscordOauth } from "@/api/gen";

import { useEffect, useMemo, useState } from "react";

export const useDiscord = () => {
  const { event } = useResolveParams();
  const { data: discord } = useGetEventDiscordOauth(event?.id ?? "", {
    query: { enabled: !!event, staleTime: 5000 },
  });

  const redirectUri = useMemo(() => {
    if (!event) {
      return "#";
    }

    const raw = `${window.location.origin}/oauth/discord`;
    return encodeURIComponent(raw);
  }, [event]);

  const discordAuthUrl = useMemo(() => {
    if (!event) {
      return "#";
    }

    const clientId = "1414585481500426371"; // TODO: move to event model

    return `https://discord.com/oauth2/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=identify+guilds.join&state=${event.id}`;
  }, [event, redirectUri]);

  const localStorageKey = useMemo(() => {
    if (!event) {
      return null;
    }

    return `discordBannerDismissed-${event.id}`;
  }, [event]);

  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (event && discord) {
      const dismissed = localStorage.getItem(localStorageKey!);
      // Show banner if no discord_user_id and not dismissed
      setShowBanner(!discord.discord_user_id && !dismissed);
    }
  }, [event, discord, localStorageKey]);

  // Optional: function to dismiss the banner
  const dismissBanner = () => {
    if (localStorageKey) {
      localStorage.setItem(localStorageKey, "1");
    }

    setShowBanner(false);
  };

  return {
    discordAuthUrl,
    redirectUri,
    localStorageKey,
    showBanner,
    dismissBanner,
  };
};
