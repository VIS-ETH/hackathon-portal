import { useResolveParams } from "./useResolveParams";

import { useGetMySecrets } from "@/api/gen";

// The personal secrets of the current user in the current event, empty outside
// of an event or if the user may not view them.
export const useMySecrets = () => {
  const { event, policies } = useResolveParams();
  const enabled = !!event && !!policies?.can_view_event_internal;
  const { data: secrets = [] } = useGetMySecrets(
    { event_id: event?.id ?? "" },
    { query: { enabled } },
  );

  return enabled ? secrets : [];
};
