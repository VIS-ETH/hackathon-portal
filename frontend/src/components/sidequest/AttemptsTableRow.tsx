import {
  useDeleteSidequestAttempt,
  useGetEventAffiliates,
  useGetSidequest,
} from "@/api/gen";
import { Attempt, EventRole } from "@/api/gen/schemas";
import { iconProps, secondaryButtonProps } from "@/styles/common";

import { FormattedDate } from "react-intl";

import { Button, Table } from "@mantine/core";

import { IconTrash } from "@tabler/icons-react";

type AttemptsTableRowProps = {
  eventId: string;
  attempt: Attempt;
  withUserName?: boolean;
  manage?: boolean;
  refetch?: () => void;
};

const AttemptsTableRow = ({
  eventId,
  attempt,
  withUserName,
  manage,
  refetch,
}: AttemptsTableRowProps) => {
  const { data: users = [] } = useGetEventAffiliates(eventId, {
    role: EventRole.Participant,
  });

  const { data: sidequest } = useGetSidequest(attempt.sidequest_id);

  const deleteAttemptMutation = useDeleteSidequestAttempt();

  const handleDelete = async () => {
    const confirmation = confirm(
      "Are you sure you want to delete this attempt?",
    );

    if (!confirmation) {
      return;
    }

    await deleteAttemptMutation.mutateAsync({
      sidequestAttemptId: attempt.id,
    });

    refetch?.();
  };

  const user = users.find((user) => user.id === attempt.user_id);

  return (
    <Table.Tr>
      {withUserName && <Table.Td>{user?.name}</Table.Td>}
      <Table.Td>{sidequest?.name}</Table.Td>
      <Table.Td>{attempt.result}</Table.Td>
      <Table.Td>
        <FormattedDate value={`${attempt.attempted_at}Z`} weekday="long" />
      </Table.Td>
      <Table.Td>
        <FormattedDate value={`${attempt.attempted_at}Z`} timeStyle="short" />
      </Table.Td>
      {manage && (
        <Table.Td>
          <Button
            {...secondaryButtonProps}
            color="red"
            leftSection={<IconTrash {...iconProps} />}
            onClick={handleDelete}
          >
            Delete
          </Button>
        </Table.Td>
      )}
    </Table.Tr>
  );
};

export default AttemptsTableRow;
