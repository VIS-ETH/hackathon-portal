import { SecretValue } from "@/api/gen/schemas";
import { inputProps } from "@/styles/common";
import { AI_API_KEY_SECRET_NAME, getKeyInfo } from "@/utils";

import { useEffect, useState } from "react";

import {
  PasswordInput,
  PasswordInputProps,
  Progress,
  Stack,
  Text,
} from "@mantine/core";

type AIKeyUsageProps = {
  apiKey: string;
};

const AIKeyUsage = ({ apiKey }: AIKeyUsageProps) => {
  const [usedBudget, setUsedBudget] = useState<number | null>(null);
  const [maxBudget, setMaxBudget] = useState<number | null>(null);

  useEffect(() => {
    getKeyInfo(apiKey).then(({ usedBudget, maxBudget }) => {
      setUsedBudget(usedBudget);
      setMaxBudget(maxBudget);
    });
  }, [apiKey]);

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
  return (
    <Stack>
      {secrets.map((secret) => (
        <Stack key={secret.name} gap="xs">
          <PasswordInput
            {...(inputProps as PasswordInputProps)}
            size="sm"
            label={secret.name}
            value={secret.value}
            readOnly
          />
          {secret.name === AI_API_KEY_SECRET_NAME && (
            <AIKeyUsage apiKey={secret.value} />
          )}
        </Stack>
      ))}
    </Stack>
  );
};

export default SecretsList;
