import { useUpdateTeam } from "@/api/gen";
import { Team } from "@/api/gen/schemas";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import {
  iconProps,
  inputProps,
  modalProps,
  primaryButtonProps,
} from "@/styles/common";

import { useEffect } from "react";

import { Button, Modal, Stack, Text, TextInput } from "@mantine/core";

import { useForm } from "@mantine/form";

import { IconBrandGit } from "@tabler/icons-react";

type TeamRepositoryModalProps = {
  team: Team;
  refetchTeam: () => void;
  opened: boolean;
  onClose: () => void;
};

// Mirrors the validation of the backend, which only accepts http(s) links with a
// domain and without credentials, and stores them normalized like `url.href`.
const isValidRepositoryUrl = (value: string) => {
  try {
    const url = new URL(value);
    return (
      ["http:", "https:"].includes(url.protocol) &&
      url.hostname.includes(".") &&
      url.username === "" &&
      url.password === "" &&
      url.href.length <= 500 &&
      !/[\s\p{Cc}]/u.test(value)
    );
  } catch {
    return false;
  }
};

const TeamRepositoryModal = ({
  team,
  refetchTeam,
  opened,
  onClose,
}: TeamRepositoryModalProps) => {
  const form = useForm({
    mode: "controlled",
    initialValues: { repository_url: "" },
    validate: {
      repository_url: (value) =>
        value.trim() === "" || isValidRepositoryUrl(value.trim())
          ? null
          : "Enter a link starting with https:// or http://",
    },
  });

  const updateTeamMutation = useUpdateTeam();

  const confirmClose = useUnsavedChanges(
    form.isDirty(),
    updateTeamMutation.isPending,
  );

  useEffect(() => {
    form.setInitialValues({ repository_url: team.repository_url ?? "" });
    form.reset();
  }, [form.setInitialValues, form.reset, team, opened]);

  const handleSubmit = async ({ repository_url }: typeof form.values) => {
    await updateTeamMutation.mutateAsync({
      teamId: team.id,
      // An empty string removes the repository.
      data: { repository_url: repository_url.trim() },
    });

    refetchTeam();
    onClose();
  };

  return (
    <Modal
      {...modalProps}
      opened={opened}
      onClose={() => confirmClose() && onClose()}
      title="Code Repository"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <Text size="sm" c="dimmed">
            Every team must publish its code in a public repository, e.g. on
            GitHub or GitLab. Make sure the repository is public, so that
            everyone can open the link.
          </Text>
          <TextInput
            {...inputProps}
            {...form.getInputProps("repository_url")}
            label="Repository link"
            placeholder="https://github.com/your-team/your-project"
            leftSection={<IconBrandGit {...iconProps} />}
            data-autofocus
          />
          <Button
            {...primaryButtonProps}
            type="submit"
            loading={updateTeamMutation.isPending}
          >
            Save
          </Button>
        </Stack>
      </form>
    </Modal>
  );
};

export default TeamRepositoryModal;
