import { confirmDiscard } from "./useUnsavedChanges";

import { useEffect, useState } from "react";

export const useHashTab = (tabs: readonly string[], defaultTab: string) => {
  const [tab, setTab] = useState<string | null>(null);
  const activeTab = tab ?? defaultTab;

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (tabs.includes(hash)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- window.location.hash is a browser-only API unavailable during SSR render
      setTab(hash);
    }
  }, [tabs]);

  const changeTab = (value: string | null) => {
    if (value && value !== activeTab && confirmDiscard()) {
      setTab(value);
      window.history.replaceState(null, "", `#${value}`);
    }
  };

  return [activeTab, changeTab] as const;
};
