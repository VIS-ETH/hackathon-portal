import GenerateAPIKeys from "../GenerateAPIKeys";
import SecretsGrid from "./SecretsGrid";

import { getGetEventSecretsQueryKey, useGetEventSecrets } from "@/api/gen";
import {
  Event,
  EventSecrets,
  Secret,
  SecretScope,
  SecretSubject,
} from "@/api/gen/schemas";
import ScrollableSegmentedControl from "@/components/ScrollableSegmentedControl";
import { confirmDiscard } from "@/hooks/useUnsavedChanges";

import { useCallback, useMemo, useState } from "react";

import { Group, Stack } from "@mantine/core";

import { useQueryClient } from "@tanstack/react-query";

const SCOPE_TABS = [
  { label: "Team Secrets", value: SecretScope.Team },
  { label: "User Secrets", value: SecretScope.User },
];

// Shared fallbacks, so the grid gets the same arrays on every render.
const EMPTY_SECRETS: Secret[] = [];
const EMPTY_SUBJECTS: SecretSubject[] = [];

type SecretsTabProps = {
  event: Event;
};

const SecretsTab = ({ event }: SecretsTabProps) => {
  const [scope, setScope] = useState<SecretScope>(SecretScope.Team);
  const queryClient = useQueryClient();
  const { data, refetch } = useGetEventSecrets({ event_id: event.id });

  const secrets = data?.secrets ?? EMPTY_SECRETS;
  const teams = data?.teams ?? EMPTY_SUBJECTS;
  const users = data?.users ?? EMPTY_SUBJECTS;

  const scopeSecrets = useMemo(
    () => secrets.filter((secret) => secret.scope === scope),
    [secrets, scope],
  );

  const handleScopeChange = (value: string) => {
    // Switching unmounts the grid, which discards its drafts.
    if (value !== scope && confirmDiscard()) {
      setScope(value as SecretScope);
    }
  };

  // Patches a saved secret into the cache instead of refetching all secrets, so
  // only the rows whose values changed re-render.
  const handleSecretChange = useCallback(
    (secret: Secret) => {
      queryClient.setQueryData<EventSecrets>(
        getGetEventSecretsQueryKey({ event_id: event.id }),
        (old) =>
          old && {
            ...old,
            secrets: old.secrets.map((s) => (s.id === secret.id ? secret : s)),
          },
      );
    },
    [queryClient, event.id],
  );

  return (
    <Stack>
      <Group>
        <ScrollableSegmentedControl
          data={SCOPE_TABS}
          value={scope}
          onChange={handleScopeChange}
        />
      </Group>
      <SecretsGrid
        key={scope}
        event={event}
        scope={scope}
        subjects={scope === SecretScope.Team ? teams : users}
        secrets={scopeSecrets}
        onSecretChange={handleSecretChange}
        refetch={refetch}
        actions={
          scope === SecretScope.Team && (
            <GenerateAPIKeys teams={teams} refetch={refetch} />
          )
        }
      />
    </Stack>
  );
};

export default SecretsTab;
