import NoEntriesTr from "../NoEntriesTr";
import AttemptsTableRow from "./AttemptsTableRow";

import {
  useDeleteSidequestAttempt,
  useGetEventAffiliates,
  useGetSidequests,
} from "@/api/gen";
import { Attempt, EventRole } from "@/api/gen/schemas";

import { useCallback, useMemo } from "react";

import { Table } from "@mantine/core";

type AttemptsTableProps = {
  eventId: string;
  attempts: Attempt[];
  manage?: boolean;
  refetch: () => void;
};

const AttemptsTable = ({
  eventId,
  attempts,
  manage,
  refetch,
}: AttemptsTableProps) => {
  const { data: users } = useGetEventAffiliates(
    eventId,
    { role: EventRole.Participant },
    { query: { enabled: !!manage } },
  );

  const { data: sidequests } = useGetSidequests({ event_id: eventId });

  const userNames = useMemo(
    () => new Map(users?.map((user) => [user.id, user.name])),
    [users],
  );

  const sidequestNames = useMemo(
    () =>
      new Map(sidequests?.map((sidequest) => [sidequest.id, sidequest.name])),
    [sidequests],
  );

  const { mutateAsync: deleteAttempt } = useDeleteSidequestAttempt();

  const handleDelete = useCallback(
    async (attempt: Attempt) => {
      const confirmation = confirm(
        "Are you sure you want to delete this attempt?",
      );

      if (!confirmation) {
        return;
      }

      await deleteAttempt({ sidequestAttemptId: attempt.id });

      refetch();
    },
    [deleteAttempt, refetch],
  );

  const columnCount = manage ? 6 : 4;

  return (
    <Table.ScrollContainer minWidth={manage ? 700 : 500}>
      <Table striped horizontalSpacing="md">
        <Table.Thead>
          <Table.Tr>
            <Table.Th w={1}>Day</Table.Th>
            <Table.Th w={1}>Time</Table.Th>
            {manage && <Table.Th>Participant</Table.Th>}
            <Table.Th>Sidequest</Table.Th>
            <Table.Th w={1} ta="right">
              Result
            </Table.Th>
            {manage && <Table.Th w={1}>Actions</Table.Th>}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {attempts.length ? (
            attempts.map((attempt) => (
              <AttemptsTableRow
                key={attempt.id}
                attempt={attempt}
                userName={userNames.get(attempt.user_id)}
                sidequestName={sidequestNames.get(attempt.sidequest_id)}
                manage={manage}
                onDelete={handleDelete}
              />
            ))
          ) : (
            <NoEntriesTr colSpan={columnCount} />
          )}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
};

export default AttemptsTable;
