import { Table, Text } from "@mantine/core";

type NoEntriesTrProps = {
  colSpan: number;
};

const NoEntriesTr = ({ colSpan }: NoEntriesTrProps) => {
  return (
    <Table.Tr>
      <Table.Td colSpan={colSpan}>
        <Text ta="center" size="sm" c="dimmed">
          No entries
        </Text>
      </Table.Td>
    </Table.Tr>
  );
};

export default NoEntriesTr;
