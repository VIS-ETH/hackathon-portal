import DataLossAlert from "./DataLossAlert";

import { modalProps, primaryButtonProps } from "@/styles/common";

import { useMemo } from "react";

import { Button, Group, Modal, Stack, Text } from "@mantine/core";

import { yaml } from "@codemirror/lang-yaml";
import { unifiedMergeView } from "@codemirror/merge";
import { oneDark } from "@codemirror/theme-one-dark";
import CodeMirror from "@uiw/react-codemirror";

const diffBasicSetup = {
  foldGutter: false,
  highlightActiveLine: false,
  highlightActiveLineGutter: false,
};

type ApplyConfigModalProps = {
  opened: boolean;
  onClose: () => void;
  onApply: () => void;
  loading: boolean;
  savedServerId: string;
  savedYaml: string;
  serverId: string;
  yamlInput: string;
};

const ApplyConfigModal = ({
  opened,
  onClose,
  onApply,
  loading,
  savedServerId,
  savedYaml,
  serverId,
  yamlInput,
}: ApplyConfigModalProps) => {
  const diffExtensions = useMemo(
    () => [
      yaml(),
      unifiedMergeView({
        original: savedYaml,
        mergeControls: false,
        collapseUnchanged: {},
      }),
    ],
    [savedYaml],
  );

  return (
    <Modal
      {...modalProps}
      opened={opened}
      onClose={onClose}
      title="Apply Discord Configuration"
      size="xl"
    >
      <Stack>
        <DataLossAlert />
        {serverId !== savedServerId && (
          <Text size="sm">
            Discord server ID:{" "}
            <Text span inherit ff="monospace">
              {savedServerId || "none"} → {serverId}
            </Text>
          </Text>
        )}
        <CodeMirror
          value={yamlInput}
          theme={oneDark}
          extensions={diffExtensions}
          basicSetup={diffBasicSetup}
          editable={false}
          readOnly
        />
        <Group justify="flex-end" gap="xs">
          <Button {...primaryButtonProps} variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button {...primaryButtonProps} onClick={onApply} loading={loading}>
            Apply Configuration
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default ApplyConfigModal;
