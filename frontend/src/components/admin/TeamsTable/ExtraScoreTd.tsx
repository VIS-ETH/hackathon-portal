import { useUpdateTeam } from "@/api/gen";
import { AdminTeam } from "@/api/gen/schemas";

import { useState } from "react";

import { NumberInput, Table, Textarea } from "@mantine/core";

type ExtraScoreTdProps = {
  team: AdminTeam;
  refetch?: () => void;
};

const ExtraScoreTd = ({ team, refetch }: ExtraScoreTdProps) => {
  const updateMutation = useUpdateTeam();
  const [comment, setComment] = useState(team.comment ?? "");
  const [extraScore, setExtraScore] = useState<string | number>(
    team.extra_score ?? "",
  );

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

  // An empty field saves "", which the backend stores as null.
  const handleCommentBlur = async () => {
    if (comment !== (team.comment ?? "")) {
      await handleUpdate(comment, undefined);
    }
  };

  // An empty field saves 0, since the backend ignores null.
  const handleExtraScoreBlur = async () => {
    const score = typeof extraScore === "number" ? extraScore : 0;
    if (score !== (team.extra_score ?? 0)) {
      await handleUpdate(undefined, score);
    }
  };

  return (
    <>
      <Table.Td>
        <Textarea
          autosize
          value={comment}
          onChange={(event) => setComment(event.currentTarget.value)}
          onBlur={handleCommentBlur}
        />
      </Table.Td>
      <Table.Td>
        <NumberInput
          value={extraScore}
          onChange={setExtraScore}
          onBlur={handleExtraScoreBlur}
        />
      </Table.Td>
    </>
  );
};

export default ExtraScoreTd;
