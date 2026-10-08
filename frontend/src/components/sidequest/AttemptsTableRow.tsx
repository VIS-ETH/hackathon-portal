import { Attempt } from "@/api/gen/schemas";
import { iconProps, secondaryButtonProps } from "@/styles/common";
import { fmtResult } from "@/utils";

import { memo } from "react";
import { FormattedDate } from "react-intl";

import { Button, Table } from "@mantine/core";

import { IconTrash } from "@tabler/icons-react";

type AttemptsTableRowProps = {
  attempt: Attempt;
  userName?: string;
  sidequestName?: string;
  manage?: boolean;
  onDelete: (attempt: Attempt) => void;
};

const AttemptsTableRow = ({
  attempt,
  userName,
  sidequestName,
  manage,
  onDelete,
}: AttemptsTableRowProps) => {
  return (
    <Table.Tr>
      <Table.Td>
        <FormattedDate value={`${attempt.attempted_at}Z`} weekday="long" />
      </Table.Td>
      <Table.Td>
        <FormattedDate value={`${attempt.attempted_at}Z`} timeStyle="short" />
      </Table.Td>
      {manage && <Table.Td>{userName}</Table.Td>}
      <Table.Td>{sidequestName}</Table.Td>
      <Table.Td ta="right">{fmtResult(attempt.result)}</Table.Td>
      {manage && (
        <Table.Td>
          <Button
            {...secondaryButtonProps}
            color="red"
            leftSection={<IconTrash {...iconProps} />}
            onClick={() => onDelete(attempt)}
          >
            Delete
          </Button>
        </Table.Td>
      )}
    </Table.Tr>
  );
};

export default memo(AttemptsTableRow);
