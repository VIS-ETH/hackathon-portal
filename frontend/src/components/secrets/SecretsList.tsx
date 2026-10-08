import { useGetConfig } from "@/api/gen";
import { SecretValue } from "@/api/gen/schemas";
import { AI_API_KEY_SECRET_NAME, getKeyInfo } from "@/api/litellm";
import { inputProps } from "@/styles/common";

import { useEffect, useState } from "react";

import { PasswordInput, Progress, Stack, Text } from "@mantine/core";

type AIKeyUsageProps = {
  liteLLMUrl: string;
  apiKey: string;
};

const AIKeyUsage = ({ liteLLMUrl, apiKey }: AIKeyUsageProps) => {
  const [usedBudget, setUsedBudget] = useState<number | null>(null);
  const [maxBudget, setMaxBudget] = useState<number | null>(null);

  useEffect(() => {
    getKeyInfo(liteLLMUrl, apiKey).then(({ usedBudget, maxBudget }) => {
      setUsedBudget(usedBudget);
      setMaxBudget(maxBudget);
    });
  }, [liteLLMUrl, apiKey]);

  return (
    <>
      <Text size="sm" mb={-5} c="dimmed">
        Usage: {(usedBudget ?? 0).toFixed(3)} / {maxBudget ?? "?"} USD
      </Text>
      <Progress
        value={maxBudget ? ((usedBudget ?? 0) / maxBudget) * 100 : 0}
        size="sm"
      />
    </>
  );
};

type SecretsListProps = {
  secrets: SecretValue[];
};

const SecretsList = ({ secrets }: SecretsListProps) => {
  const { data: config } = useGetConfig({
    query: { staleTime: Infinity },
  });
  const liteLLMUrl = config?.litellm_url;

  return (
    <Stack>
      {secrets.map((secret) => (
        <Stack key={secret.name} gap="xs">
          <PasswordInput
            {...inputProps}
            size="sm"
            label={secret.name}
            value={secret.value}
            readOnly
          />
          {secret.name === AI_API_KEY_SECRET_NAME && liteLLMUrl && (
            <AIKeyUsage liteLLMUrl={liteLLMUrl} apiKey={secret.value} />
          )}
        </Stack>
      ))}
    </Stack>
  );
};

export default SecretsList;
