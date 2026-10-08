import SecretDescriptionModal from "./SecretDescriptionModal";
import SecretImportControls from "./SecretImportControls";
import SecretsGridRow from "./SecretsGridRow";
import { fmtYamlLines } from "./fmtYaml";

import { useCreateSecret, useDeleteSecret } from "@/api/gen";
import {
  Event,
  EventRole,
  Secret,
  SecretScope,
  SecretSubject,
} from "@/api/gen/schemas";
import NoEntriesTr from "@/components/NoEntriesTr";
import ScrollableSegmentedControl from "@/components/ScrollableSegmentedControl";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import {
  cardProps,
  cardSectionProps,
  iconProps,
  inputProps,
  toolbarButtonProps,
} from "@/styles/common";

import { ReactNode, useMemo, useState } from "react";

import {
  ActionIcon,
  Button,
  Card,
  Group,
  Stack,
  Table,
  Text,
  TextInput,
} from "@mantine/core";

import { useClipboard } from "@mantine/hooks";

import {
  IconCopy,
  IconFileDescription,
  IconPlus,
  IconRefresh,
  IconTrash,
} from "@tabler/icons-react";

type SecretsGridProps = {
  event: Event;
  scope: SecretScope;
  subjects: SecretSubject[];
  secrets: Secret[];
  onSecretChange: (secret: Pick<Secret, "id"> & Partial<Secret>) => void;
  refetch: () => Promise<unknown>;
  actions?: ReactNode;
};

const SecretsGrid = ({
  event,
  scope,
  subjects,
  secrets,
  onSecretChange,
  refetch,
  actions,
}: SecretsGridProps) => {
  const isUserScope = scope === SecretScope.User;

  const [roleFilter, setRoleFilter] = useState<EventRole | undefined>(
    EventRole.Participant,
  );
  const [newName, setNewName] = useState("");
  const [describedSecret, setDescribedSecret] = useState<Secret | null>(null);
  const clipboard = useClipboard();

  const createSecretMutation = useCreateSecret();
  const deleteSecretMutation = useDeleteSecret();

  useUnsavedChanges(newName.trim() !== "");

  const filteredSubjects = useMemo(
    () =>
      isUserScope && roleFilter
        ? subjects.filter((subject) => subject.roles.includes(roleFilter))
        : subjects,
    [subjects, isUserScope, roleFilter],
  );

  const roleFilterValue = roleFilter ?? "All";
  const roleFilterTabs = ["All", ...Object.values(EventRole)].map((role) => ({
    label:
      role === roleFilterValue ? `${role} (${filteredSubjects.length})` : role,
    value: role,
  }));

  // Teams share the key `team-00` until they are indexed.
  const keysAreUnique =
    new Set(subjects.map((subject) => subject.key)).size === subjects.length;

  // The template lists the subjects currently shown in the grid.
  const handleCopyTemplate = () => {
    clipboard.copy(
      fmtYamlLines(
        filteredSubjects.map((subject) => ({
          key: subject.key,
          value: '""',
          comment: subject.label,
        })),
      ),
    );
  };

  const handleCreate = async () => {
    const name = newName.trim();

    // Pressing Enter does not respect the disabled button.
    if (!name || createSecretMutation.isPending) {
      return;
    }

    await createSecretMutation.mutateAsync({
      data: { event_id: event.id, scope, name },
    });

    setNewName("");
    await refetch();
  };

  const handleDelete = async (secret: Secret) => {
    const count = Object.keys(secret.values).length;
    const confirmation = confirm(
      `Are you sure you want to delete the secret "${secret.name}"?\n\nThis also deletes its ${count} values.`,
    );

    if (!confirmation) {
      return;
    }

    await deleteSecretMutation.mutateAsync({ secretId: secret.id });
    await refetch();
  };

  return (
    <Stack>
      <SecretImportControls
        scope={scope}
        secrets={secrets}
        subjects={subjects}
        disabled={!keysAreUnique}
        onSecretChange={onSecretChange}
      />
      <Card {...cardProps}>
        <Card.Section {...cardSectionProps}>
          <Group>
            <Button
              {...toolbarButtonProps}
              leftSection={<IconRefresh {...iconProps} />}
              onClick={() => {
                refetch();
              }}
            >
              Refresh
            </Button>
            <TextInput
              {...inputProps}
              size="sm"
              placeholder="New secret name"
              value={newName}
              onChange={(e) => setNewName(e.currentTarget.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <Button
              {...toolbarButtonProps}
              leftSection={<IconPlus {...iconProps} />}
              onClick={handleCreate}
              disabled={newName.trim() === "" || createSecretMutation.isPending}
            >
              Add Secret
            </Button>
            <Button
              {...toolbarButtonProps}
              leftSection={<IconCopy {...iconProps} />}
              onClick={handleCopyTemplate}
              disabled={!keysAreUnique || !filteredSubjects.length}
            >
              {clipboard.copied
                ? "Copied"
                : `Copy Template (${filteredSubjects.length})`}
            </Button>
            {actions}
          </Group>
        </Card.Section>
        {isUserScope && (
          <Card.Section {...cardSectionProps}>
            <ScrollableSegmentedControl
              data={roleFilterTabs}
              value={roleFilterValue}
              onChange={(value) =>
                setRoleFilter(
                  value === "All" ? undefined : (value as EventRole),
                )
              }
            />
          </Card.Section>
        )}
        {!keysAreUnique && (
          <Card.Section {...cardSectionProps}>
            <Text size="sm" c="red">
              Team indices are not unique, index the teams before importing
            </Text>
          </Card.Section>
        )}
        <Card.Section>
          <Table.ScrollContainer minWidth={0}>
            <Table striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th miw={isUserScope ? 250 : 50}>
                    {isUserScope ? "Auth ID" : "Idx"}
                  </Table.Th>
                  <Table.Th miw={200}>Name</Table.Th>
                  {secrets.map((secret) => (
                    <Table.Th key={secret.id} miw={200}>
                      <Group justify="space-between" wrap="nowrap">
                        <Text size="sm" fw={700}>
                          {secret.name}
                        </Text>
                        <Group gap={0} wrap="nowrap">
                          <ActionIcon
                            variant="subtle"
                            color={secret.description ? undefined : "gray"}
                            aria-label={`Edit the description of ${secret.name}`}
                            onClick={() => setDescribedSecret(secret)}
                          >
                            <IconFileDescription {...iconProps} />
                          </ActionIcon>
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            aria-label={`Delete ${secret.name}`}
                            onClick={() => handleDelete(secret)}
                            disabled={deleteSecretMutation.isPending}
                          >
                            <IconTrash {...iconProps} />
                          </ActionIcon>
                        </Group>
                      </Group>
                    </Table.Th>
                  ))}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredSubjects.length ? (
                  filteredSubjects.map((subject) => (
                    <SecretsGridRow
                      key={subject.id}
                      subject={subject}
                      secrets={secrets}
                      onSecretChange={onSecretChange}
                    />
                  ))
                ) : (
                  <NoEntriesTr colSpan={secrets.length + 2} />
                )}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Card.Section>
      </Card>
      {describedSecret && (
        <SecretDescriptionModal
          secret={describedSecret}
          onSecretChange={onSecretChange}
          onClose={() => setDescribedSecret(null)}
        />
      )}
    </Stack>
  );
};

export default SecretsGrid;
