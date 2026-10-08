import { useUpdateTeam } from "@/api/gen";
import { AdminTeam } from "@/api/gen/schemas";
import { useBlurSave } from "@/hooks/useBlurSave";
import { inputProps } from "@/styles/common";

import { NumberInput, Table, Textarea } from "@mantine/core";

type ExtraScoreTdProps = {
  team: AdminTeam;
  refetch?: () => Promise<unknown>;
};

const ExtraScoreTd = ({ team, refetch }: ExtraScoreTdProps) => {
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
    await refetch?.();
  };

  // An empty field saves "", which the backend stores as null.
  const comment = useBlurSave(team.comment ?? "", (value) =>
    handleUpdate(value, undefined),
  );

  // An empty field saves 0, since the backend ignores null.
  const extraScore = useBlurSave<string | number>(
    team.extra_score ?? "",
    async (value) => {
      const score = typeof value === "number" ? value : 0;
      if (score !== (team.extra_score ?? 0)) {
        await handleUpdate(undefined, score);
      }
    },
  );

  return (
    <>
      <Table.Td>
        <Textarea
          {...inputProps}
          size="xs"
          autosize
          value={comment.value}
          onChange={(event) => comment.setDraft(event.currentTarget.value)}
          onBlur={comment.commit}
          disabled={comment.saving}
        />
      </Table.Td>
      <Table.Td>
        <NumberInput
          {...inputProps}
          size="xs"
          value={extraScore.value}
          onChange={extraScore.setDraft}
          onBlur={extraScore.commit}
          disabled={extraScore.saving}
        />
      </Table.Td>
    </>
  );
};

export default ExtraScoreTd;
