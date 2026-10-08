import { useGetConfig } from "@/api/gen";
import { SecretValue } from "@/api/gen/schemas";
import { AI_API_KEY_SECRET_NAME, getKeyInfo } from "@/api/litellm";
import Markdown from "@/components/Markdown";
import { iconProps, inputProps } from "@/styles/common";

import { Fragment, useEffect, useState } from "react";

import {
  ActionIcon,
  CopyButton,
  Divider,
  Group,
  PasswordInput,
  Progress,
  Stack,
  Text,
} from "@mantine/core";

import { IconCheck, IconCopy } from "@tabler/icons-react";

type AIKeyUsageProps = {
  liteLLMUrl: string;
  apiKey: string;
};

const AIKeyUsage = ({ liteLLMUrl, apiKey }: AIKeyUsageProps) => {
  const [usedBudget, setUsedBudget] = useState<number | null>(null);
  const [maxBudget, setMaxBudget] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    getKeyInfo(liteLLMUrl, apiKey)
      .then(({ usedBudget, maxBudget }) => {
        setUsedBudget(usedBudget);
        setMaxBudget(maxBudget);
      })
      .catch(() => setFailed(true));
  }, [liteLLMUrl, apiKey]);

  if (failed) {
    return (
      <Text size="sm" c="dimmed">
        Usage unavailable
      </Text>
    );
  }

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
    <Stack gap="lg">
      {secrets.map((secret, index) => (
        <Fragment key={secret.name}>
          {/* the modal body's or card section's padding, so the divider spans the whole width */}
          {index > 0 && <Divider mx="-md" />}
          <Stack gap="xs">
            {/* styled like the input labels and descriptions of the access details */}
            <Stack gap={2}>
              <Text size="sm" fw={500}>
                {secret.name}
              </Text>
              {secret.description && (
                // Long links, e.g. redeem URLs, would overflow the modal.
                <Text
                  size="xs"
                  c="dimmed"
                  component="div"
                  style={{ overflowWrap: "anywhere" }}
                >
                  <Markdown trusted allowHtml content={secret.description} />
                </Text>
              )}
            </Stack>
            <Group gap="xs" wrap="nowrap">
              <PasswordInput
                {...inputProps}
                size="sm"
                aria-label={secret.name}
                value={secret.value}
                readOnly
                flex={1}
              />
              <CopyButton value={secret.value}>
                {({ copied, copy }) => (
                  <ActionIcon
                    variant="default"
                    size="input-sm"
                    radius={inputProps.radius}
                    aria-label={copied ? "Copied" : `Copy ${secret.name}`}
                    onClick={copy}
                  >
                    {copied ? (
                      <IconCheck {...iconProps} />
                    ) : (
                      <IconCopy {...iconProps} />
                    )}
                  </ActionIcon>
                )}
              </CopyButton>
            </Group>
            {secret.name === AI_API_KEY_SECRET_NAME && liteLLMUrl && (
              <AIKeyUsage liteLLMUrl={liteLLMUrl} apiKey={secret.value} />
            )}
          </Stack>
        </Fragment>
      ))}
    </Stack>
  );
};

export default SecretsList;
