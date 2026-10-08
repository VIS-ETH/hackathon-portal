import { useUpdateSecret } from "@/api/gen";
import { Secret } from "@/api/gen/schemas";
import MarkdownCard from "@/components/MarkdownCard";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { modalProps, primaryButtonProps, textareaProps } from "@/styles/common";

import { useState } from "react";

import { Button, Group, Modal, Stack, Textarea } from "@mantine/core";

type SecretDescriptionModalProps = {
  secret: Secret;
  onSecretChange: (secret: Pick<Secret, "id"> & Partial<Secret>) => void;
  onClose: () => void;
};

// Mounted per secret, so the draft starts from the saved description.
const SecretDescriptionModal = ({
  secret,
  onSecretChange,
  onClose,
}: SecretDescriptionModalProps) => {
  const [description, setDescription] = useState(secret.description ?? "");

  const updateSecretMutation = useUpdateSecret();

  const hasChanges = description !== (secret.description ?? "");
  const confirmClose = useUnsavedChanges(
    hasChanges,
    updateSecretMutation.isPending,
  );

  const handleSave = async () => {
    const updated = await updateSecretMutation.mutateAsync({
      secretId: secret.id,
      data: { description },
    });

    // The response leaves out the values.
    onSecretChange({ id: updated.id, description: updated.description });
    onClose();
  };

  return (
    <Modal
      {...modalProps}
      size="xl"
      opened
      onClose={() => confirmClose() && onClose()}
      title={`Description of ${secret.name}`}
    >
      <Stack>
        <Textarea
          {...textareaProps}
          value={description}
          onChange={(e) => setDescription(e.currentTarget.value)}
          label="Description"
          description="Shown to the teams or users below their value. Supports Markdown and HTML."
        />
        {description && (
          <MarkdownCard trusted content={description} allowHtml />
        )}
        <Group>
          <Button
            {...primaryButtonProps}
            disabled={!hasChanges}
            onClick={handleSave}
            loading={updateSecretMutation.isPending}
          >
            Save
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default SecretDescriptionModal;
