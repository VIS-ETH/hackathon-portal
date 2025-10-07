import { useUpdateTeam } from "@/api/gen";
import { AdminTeam } from "@/api/gen/schemas";

import { NumberInput, Table, Textarea } from "@mantine/core";

type ActionsTdProps = {
  team: AdminTeam;
  refetch?: () => void;
};

const ExtraScoreTd = ({ team, refetch }: ActionsTdProps) => {
  const updateMutation = useUpdateTeam();

  const handleUpdate = async (
    comment: string | undefined,
    score: number | undefined,
  ) => {
    await updateMutation.mutateAsync({
      teamId: team.id,
      data: {
        comment: comment,
        extra_score: score,
      },
    });
    refetch?.();
  };

  return (
    <>
      <Table.Td>
        <Textarea
          autosize
          value={team.comment || undefined}
          onChange={async (value) =>
            handleUpdate(value.target.value, undefined)
          }
        />
      </Table.Td>
      <Table.Td>
        <NumberInput
          value={team.extra_score || undefined}
          onChange={async (value) =>
            handleUpdate(undefined, parseFloat(value.toString()))
          }
        />
      </Table.Td>
    </>
  );
};

export default ExtraScoreTd;
